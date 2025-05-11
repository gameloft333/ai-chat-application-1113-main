import { db, withRetry } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import { supabaseAdmin } from '../index.js';

class WebhookService {
  static async handlePaymentSuccess(paymentIntent) {
    try {
      console.log('[WebhookService] 开始处理支付成功:', paymentIntent.id);
      
      // 1. 记录支付状态 (Firebase)
      const paymentRecord = await this.updatePaymentRecordFirebase(paymentIntent);
      console.log('[WebhookService] Firebase paymentRecord updated:', paymentRecord);
      
      // 2. 如果支付成功，更新用户信息 (Firebase)
      if (paymentRecord.status === 'completed') {
        // USE paymentRecord as the source of truth for userId, planId, duration
        const firebaseUid = paymentRecord.userId; 
        const planIdFromRecord = paymentRecord.planId;
        const durationFromRecord = paymentRecord.duration;
        
        if (!firebaseUid) {
          console.error('[WebhookService] Firebase UID (userId) missing in paymentRecord. Skipping Firebase user update and Supabase sync.');
          // Still return success to Stripe as the payment itself was recorded in Firebase paymentRecords
          return { success: true, orderId: paymentIntent.id, message: 'Firebase UID missing in paymentRecord, partial success.' };
        }

        const userRef = db.collection('users').doc(firebaseUid);
        const newExpiryDate = calculateExpiredAt(durationFromRecord); // Use durationFromRecord
        try {
          await userRef.set({ 
            planLevel: planIdFromRecord,       // Use value from paymentRecord
            planDuration: durationFromRecord,  // Use value from paymentRecord
            expiredAt: newExpiryDate, 
            updatedAt: new Date().toISOString()
          }, { merge: true }); 
          console.log(`[WebhookService] Firebase user ${firebaseUid} upserted with plan: ${planIdFromRecord}, duration: ${durationFromRecord}, expires: ${newExpiryDate.toISOString()}`);
        } catch (userProfileUpdateError) {
          console.error(`[WebhookService] Error upserting Firebase user profile for ${firebaseUid} (UID: ${firebaseUid}):`, userProfileUpdateError);
          // Log error but continue to allow Supabase sync and WebSocket emission
        }
        
        // 3. 发送 WebSocket 消息通知前端 (Firebase related)
        if (global.io) {
            global.io.to(firebaseUid).emit('payment:success', {
                orderId: paymentIntent.id,
                planId: planIdFromRecord,
                duration: durationFromRecord
            });
            console.log(`[WebhookService] WebSocket event 'payment:success' emitted to ${firebaseUid}`);
        } else {
            console.warn('[WebhookService] global.io not available for WebSocket message.');
        }

        // 4. Sync to Supabase (New Logic)
        try {
          console.log('[WebhookService] Attempting Supabase sync...');
          const { data: supabaseUser, error: supabaseUserError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('firebase_uid', firebaseUid)
            .single();

          if (supabaseUserError || !supabaseUser) {
            console.error(`[WebhookService] Supabase user not found for Firebase UID ${firebaseUid}. Error: ${supabaseUserError?.message}. Skipping Supabase payment/subscription sync.`);
          } else {
            const supabaseUserId = supabaseUser.id;
            console.log(`[WebhookService] Found Supabase user ID: ${supabaseUserId} for Firebase UID: ${firebaseUid}`);

            // 4a. Sync to Supabase 'payments' table
            const paymentAmountSupabase = paymentIntent.amount / 100; // Convert cents to decimal
            const { data: supabasePayment, error: supabasePaymentError } = await supabaseAdmin
              .from('payments')
              .insert({
                user_id: supabaseUserId,
                amount: paymentAmountSupabase,
                currency: paymentIntent.currency.toUpperCase(),
                payment_method: 'stripe',
                status: 'succeeded', // Match paymentRecord.status or be explicit
                transaction_id: paymentIntent.id, // Stripe Payment Intent ID
                metadata: {
                  firebasePaymentRecordId: paymentRecord.id, // Link to Firebase record
                  rawStripeEvent: paymentIntent // Store the raw event if needed, can be large
                }
              })
              .select('id') // Select the ID of the newly inserted payment
              .single();

            if (supabasePaymentError) {
              console.error(`[WebhookService] Error inserting into Supabase payments table for user ${supabaseUserId}:`, supabasePaymentError);
            } else {
              console.log(`[WebhookService] Successfully inserted into Supabase payments table for user ${supabaseUserId}, payment ID: ${supabasePayment?.id}`);
              
              // 4b. Sync to Supabase 'subscriptions' table (Upsert logic)
              // We will upsert based on user_id, assuming one primary subscription for this flow.
              // If a plan_id changes, this will update it.
              const subscriptionData = {
                user_id: supabaseUserId,
                plan_id: planIdFromRecord, // Use value from paymentRecord
                status: 'active',
                started_at: new Date().toISOString(),
                expires_at: newExpiryDate.toISOString(), 
                last_payment_id: supabasePayment?.id || null, // Link to the Supabase payment record
                updated_at: new Date().toISOString() // Ensure updated_at is set
              };

              // Attempt to update existing active subscription or insert a new one.
              // First, try to find an existing subscription for the user.
              const { data: existingSub, error: findSubError } = await supabaseAdmin
                .from('subscriptions')
                .select('id')
                .eq('user_id', supabaseUserId)
                // .eq('status', 'active') // Optionally only target active ones to update
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(); 

              if (findSubError) {
                 console.error(`[WebhookService] Error finding existing Supabase subscription for user ${supabaseUserId}:`, findSubError);
              } else if (existingSub) {
                // Update existing subscription
                const { error: updateSubError } = await supabaseAdmin
                  .from('subscriptions')
                  .update({
                      ...subscriptionData, // spread all fields, ID will be ignored if primary key
                      id: undefined, // ensure id is not in update payload if not intending to change PK
                  })
                  .eq('id', existingSub.id);
                if (updateSubError) {
                    console.error(`[WebhookService] Error updating Supabase subscription ${existingSub.id} for user ${supabaseUserId}:`, updateSubError);
                } else {
                    console.log(`[WebhookService] Successfully updated Supabase subscription ${existingSub.id} for user ${supabaseUserId}`);
                }
              } else {
                // Insert new subscription
                const { error: insertSubError } = await supabaseAdmin
                  .from('subscriptions')
                  .insert(subscriptionData)
                  .select(); // Select to confirm insertion
                 if (insertSubError) {
                    console.error(`[WebhookService] Error inserting new Supabase subscription for user ${supabaseUserId}:`, insertSubError);
                 } else {
                    console.log(`[WebhookService] Successfully inserted new Supabase subscription for user ${supabaseUserId}`);
                 }
              }

              // ***** ADDED LOGIC TO UPDATE public.users table *****
              if (planIdFromRecord && newExpiryDate && supabaseUserId) { // Use planIdFromRecord
                const { error: updateUserTableError } = await supabaseAdmin
                  .from('users')
                  .update({
                    subscription_status: planIdFromRecord, // Use planIdFromRecord
                    subscription_expires_at: newExpiryDate.toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', supabaseUserId);

                if (updateUserTableError) {
                  console.error(`[WebhookService] Error updating public.users table for ${supabaseUserId} after subscription update:`, updateUserTableError);
                } else {
                  console.log(`[WebhookService] Successfully updated public.users table for ${supabaseUserId} with status ${planIdFromRecord}`);
                }
              } else {
                console.warn('[WebhookService] Missing planId, newExpiryDate, or supabaseUserId for public.users table update.');
              }
              // ***** END OF ADDED LOGIC *****

            }
          }
        } catch (supabaseSyncError) {
          console.error('[WebhookService] Error during Supabase sync process:', supabaseSyncError);
          // Do not re-throw; allow Firebase part to be considered success for Stripe
        }

      } else {
        console.log('[WebhookService] Payment record status is not completed. Status:', paymentRecord.status);
      }

      return { success: true, orderId: paymentIntent.id };
    } catch (error) {
      console.error('[WebhookService] Error in handlePaymentSuccess:', error);
      // Consider if this should throw to indicate failure to Stripe, 
      // or if Firebase payment record creation is enough to signal success.
      // For now, re-throwing to align with previous behavior.
      throw error;
    }
  }

  static async updatePaymentRecordFirebase(paymentIntent) {
    let recordRef;
    let recordData;
    const firebaseUid = paymentIntent.metadata?.userId || null;

    await withRetry(async () => {
      const paymentSnapshot = await db.collection('paymentRecords')
        .where('orderId', '==', paymentIntent.id)
        .get();

      if (paymentSnapshot.empty) {
        const newRecord = {
          orderId: paymentIntent.id,
          status: 'completed', 
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          userId: firebaseUid, 
          planId: paymentIntent.metadata?.planId || null, 
          duration: paymentIntent.metadata?.duration || null, 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        };
        recordRef = await db.collection('paymentRecords').add(newRecord);
        recordData = { id: recordRef.id, ...newRecord };
      } else {
        recordRef = paymentSnapshot.docs[0].ref;
        const existingData = paymentSnapshot.docs[0].data();
        const updatedData = {
          status: 'completed', 
          updatedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          userId: firebaseUid || existingData.userId || null,
          planId: paymentIntent.metadata?.planId || existingData.planId || null,
          duration: paymentIntent.metadata?.duration || existingData.duration || null,
        };
        await recordRef.update(updatedData);
        const updatedDoc = await recordRef.get();
        recordData = { id: updatedDoc.id, ...updatedDoc.data() };
      }
    });
    return recordData; 
  }

  static async updateUserInfo(paymentIntent) {
    const { userId, planId, duration } = paymentIntent.metadata;
    if (!userId) {
      throw new Error('缺少用户ID，无法更新用户信息');
    }

    await withRetry(async () => {
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        planLevel: planId,
        planDuration: duration,
        expiredAt: calculateExpiredAt(duration),
        updatedAt: new Date().toISOString(),
        paymentHistory: FieldValue.arrayUnion({
          orderId: paymentIntent.id,
          planId,
          duration,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          paidAt: new Date().toISOString()
        })
      });
    });
  }

  static async handleCheckoutCompleted(session) {
    try {
      console.log('处理结账完成:', session.id);
      // 实现结账完成的处理逻辑
    } catch (error) {
      console.error('处理结账完成事件失败:', error);
      throw error;
    }
  }

  static async handleSubscriptionCreated(data) {
    try {
      console.log('处理订阅创建:', data);
      // 实现订阅创建的处理逻辑
    } catch (error) {
      console.error('处理订阅创建事件失败:', error);
      throw error;
    }
  }

  static async addToOfflineQueue(type, data) {
    try {
      await db.collection('offlineQueue').add({
        type,
        data,
        createdAt: new Date().toISOString(),
        status: 'pending',
        retryCount: 0
      });
    } catch (error) {
      console.error('添加离线队列失败:', error);
      // 如果连离线队列都无法添加，则写入本地文件
      this.writeToLocalFile(type, data);
    }
  }

  static writeToLocalFile(type, data) {
    // 实现本地文件写入逻辑
  }
}

// 添加计算过期时间的工具函数
const calculateExpiredAt = (duration) => {
  const now = new Date();
  switch(duration) {
    case 'month':
      return new Date(now.setMonth(now.getMonth() + 1));
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() + 1));
    case 'week':
      return new Date(now.setDate(now.getDate() + 7));
    default:
      return new Date(now.setMonth(now.getMonth() + 1)); // 默认一个月
  }
};

export default WebhookService; 