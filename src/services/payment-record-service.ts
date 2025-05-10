import { db } from '../config/firebase-config';
import { collection, doc, setDoc, getDoc, query, where, getDocs, updateDoc, addDoc, limit, orderBy } from 'firebase/firestore';
import { PaymentRecord, PaymentChannel } from '../types/payment';
import { auth } from '../config/firebase-config';
import logger from '../utils/logger';

interface SubscriptionStatus {
  isSubscribed: boolean;
  expiredAt?: Date;
  remainingDays?: number;
  planLevel?: 'trial' | 'basic' | 'pro' | 'premium';
  duration?: string;
}

export class PaymentRecordService {
    private static COLLECTION = 'paymentRecords';

    static async createPaymentRecord(record: PaymentRecord): Promise<void> {
        try {
            if (!record.paymentChannel) {
                throw new Error('支付渠道不能为空');
            }
            
            await addDoc(collection(db, 'paymentRecords'), {
                ...record,
                createdAt: record.createdAt.toISOString(),
                expiredAt: record.expiredAt.toISOString(),
                userEmail: record.userEmail || '',
                paymentAccount: record.paymentAccount || ''
            });
        } catch (error) {
            logger.error('创建支付记录失败:', error);
            throw error;
        }
    }

    static async updatePaymentRecord(recordId: string, data: Partial<PaymentRecord>) {
        try {
            const docRef = doc(db, 'paymentRecords', recordId);
            const updateData: any = { ...data };
            
            if (data.completedAt) {
                updateData.completedAt = data.completedAt.toISOString();
            }
            
            await updateDoc(docRef, updateData);
        } catch (error) {
            logger.error('更新支付记录失败:', error);
            throw error;
        }
    }

    static async updatePaymentWithAccountInfo(
        orderId: string, 
        paymentAccount: string,
        paymentChannel: PaymentChannel,
        status: 'completed' | 'failed' | 'pending' = 'completed'
    ): Promise<void> {
        try {
            const q = query(
                collection(db, 'paymentRecords'), 
                where('orderId', '==', orderId),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const docRef = doc(db, 'paymentRecords', querySnapshot.docs[0].id);
                await updateDoc(docRef, {
                    status,
                    paymentAccount,
                    paymentChannel,
                    completedAt: status === 'completed' ? new Date().toISOString() : null
                });
            }
        } catch (error) {
            logger.error('更新支付账号信息失败:', error);
            throw error;
        }
    }

    static async getPaymentRecordByOrderId(orderId: string): Promise<PaymentRecord | null> {
        try {
            const q = query(
                collection(db, 'paymentRecords'),
                where('orderId', '==', orderId),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return {
                    id: doc.id,
                    ...doc.data(),
                    createdAt: new Date(doc.data().createdAt),
                    expiredAt: new Date(doc.data().expiredAt),
                    completedAt: doc.data().completedAt ? new Date(doc.data().completedAt) : undefined
                } as PaymentRecord;
            }
            return null;
        } catch (error) {
            logger.error('获取支付记录失败:', error);
            return null;
        }
    }

    static async getUserPayments(uid: string): Promise<PaymentRecord[]> {
        const paymentsRef = collection(db, this.COLLECTION);
        const q = query(paymentsRef, where('uid', '==', uid));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                createdAt: new Date(data.createdAt),
                expiredAt: new Date(data.expiredAt),
                completedAt: data.completedAt ? new Date(data.completedAt) : undefined
            } as PaymentRecord;
        });
    }

    static async getActiveSubscription(uid: string): Promise<PaymentRecord | null> {
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            try {
                logger.debug(`尝试获取活跃订阅 (尝试 ${retryCount + 1}/${maxRetries})`, { uid });
                
                const paymentsRef = collection(db, this.COLLECTION);
                const q = query(
                    paymentsRef,
                    where('uid', '==', uid),
                    where('status', '==', 'completed'),
                    orderBy('expiredAt', 'desc'),
                    limit(1)
                );

                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    const doc = querySnapshot.docs[0];
                    const data = doc.data();
                    
                    logger.debug('获取到订阅数据:', {
                        id: doc.id,
                        expiredAt: data.expiredAt,
                        status: data.status
                    });
                    
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: new Date(data.createdAt),
                        expiredAt: new Date(data.expiredAt),
                        completedAt: data.completedAt ? new Date(data.completedAt) : undefined
                    } as PaymentRecord;
                }
                
                logger.debug('未找到活跃订阅');
                return null;
                
            } catch (error) {
                logger.error(`获取活跃订阅失败 (尝试 ${retryCount + 1}/${maxRetries}):`, error);
                
                if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
                    logger.error('权限被拒绝，请检查用户认证状态');
                    return null;
                }
                
                retryCount++;
                if (retryCount === maxRetries) {
                    logger.error('达到最大重试次数，获取活跃订阅失败');
                    return null;
                }
                
                // 等待一段时间后重试
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
        }
        
        return null;
    }

    static async updatePaymentStatus(
        orderId: string,
        status: 'completed' | 'failed' | 'pending',
        paymentAccount?: string
    ): Promise<void> {
        try {
            const q = query(
                collection(db, 'paymentRecords'), 
                where('orderId', '==', orderId),
                limit(1)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docRef = doc(db, 'paymentRecords', querySnapshot.docs[0].id);
                const updateData: any = {
                    status,
                    updatedAt: new Date().toISOString()
                };

                if (paymentAccount) {
                    updateData.paymentAccount = paymentAccount;
                }

                if (status === 'completed') {
                    updateData.completedAt = new Date().toISOString();
                }

                await updateDoc(docRef, updateData);
            }
        } catch (error) {
            logger.error('更新支付状态失败:', error);
            throw error;
        }
    }

    static async getActiveSubscriptionByEmail(email: string): Promise<PaymentRecord | null> {
        try {
            // 添加调试日志
            const validateUserAuth = () => {
                const user = auth.currentUser;
                logger.debug('认证状态:', {
                    isAuthenticated: !!user,
                    uid: user?.uid,
                    email: user?.email,
                    emailVerified: user?.emailVerified
                });
                return !!user;
            };

            // 在调用获取订阅记录之前验证
            if (!validateUserAuth()) {
                logger.error('用户未登录或认证失败');
                return null;
            }

            // 确保查询的邮箱与当前用户匹配
            if (email !== auth.currentUser.email) {
                logger.warn('getActiveSubscriptionByEmail: 无权访问其他用户的订阅记录');
                return null;
            }

            logger.debug('开始查询订阅记录:', {
                email,
                currentUser: auth.currentUser.uid,
                isAuthenticated: !!auth.currentUser
            });

            const paymentsRef = collection(db, 'paymentRecords');
            const q = query(
                paymentsRef,
                where('paymentAccount', '==', email),
                where('status', '==', 'completed')
            );

            const querySnapshot = await getDocs(q);
            const now = new Date();

            const validRecords = querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: new Date(doc.data().createdAt),
                    expiredAt: new Date(doc.data().expiredAt),
                    completedAt: doc.data().completedAt ? new Date(doc.data().completedAt) : undefined
                } as PaymentRecord))
                .filter(record => record.expiredAt > now)
                .sort((a, b) => b.expiredAt.getTime() - a.expiredAt.getTime());

            return validRecords[0] || null;
        } catch (error) {
            logger.error('获取邮箱订阅记录失败:', error);
            return null;
        }
    }

    static async getExpiryDate(userId: string): Promise<Date | null> {
        try {
            const activeSubscription = await this.getActiveSubscription(userId);
            if (activeSubscription && activeSubscription.expiredAt) {
                return new Date(activeSubscription.expiredAt);
            }
            return null;
        } catch (error) {
            logger.error('获取到期时间失败:', error);
            return null;
        }
    }

    // for payment server mode
    static async handlePaymentSuccess(orderId: string, paymentAccount: string): Promise<void> {
        try {
            // 先更新支付状态
            await this.updatePaymentStatus(orderId, 'completed', paymentAccount);
            
            // 获取更新后的记录
            const updatedRecord = await this.getPaymentRecordByOrderId(orderId);
            
            if (updatedRecord) {
                logger.debug('支付成功，更新后的记录:', updatedRecord);
                // 触发订阅更新事件
                window.dispatchEvent(new CustomEvent('subscription-updated', {
                    detail: {
                        orderId,
                        uid: updatedRecord.uid,
                        userEmail: updatedRecord.userEmail,
                        expiredAt: updatedRecord.expiredAt
                    }
                }));
            }
        } catch (error) {
            logger.error('处理支付成功失败:', error);
            throw error;
        }
    }

   
    /*// for payment link mode
    static async handlePaymentSuccess(orderId: string, userEmail: string) {
        const paymentRecord = await this.getPaymentRecordByOrderId(orderId);
        if (!paymentRecord) return;

        const batch = db.batch();
        
        // 更新支付记录
        const paymentRef = db.collection('payments').doc(orderId);
        batch.update(paymentRef, { 
          status: 'completed',
          completedAt: new Date()
        });
        
        // 更新用户信息
        const userRef = db.collection('users').doc(paymentRecord.uid);
        batch.update(userRef, {
          planLevel: paymentRecord.planId,
          planDuration: paymentRecord.duration,
          expiredAt: paymentRecord.expiredAt,
          updatedAt: new Date()
        });
        
        await batch.commit();
    }
*/
    static async getSubscriptionStatus(uid: string, userEmail?: string): Promise<SubscriptionStatus> {
        try {
            logger.debug('开始查询订阅状态:', { uid, userEmail });
            const activeSubscription = await this.getActiveSubscription(uid);
            
            if (activeSubscription && activeSubscription.expiredAt) {
                const now = new Date();
                const expiredAt = new Date(activeSubscription.expiredAt);
                
                // 保留原有的精确计算天数方法
                const calculateDays = (startDate: Date, endDate: Date): number => {
                    // 转换为本地时间
                    const start = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000);
                    const end = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000);
                    
                    // 设置时间为午夜以确保准确计算天数
                    start.setHours(0, 0, 0, 0);
                    end.setHours(0, 0, 0, 0);
                    
                    // 计算毫秒差异并转换为天数
                    const diffTime = end.getTime() - start.getTime();
                    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    logger.debug('天数计算详情:', {
                        startDate: start.toISOString(),
                        endDate: end.toISOString(),
                        diffTime,
                        days
                    });
                    
                    return days;
                };

                const remainingDays = calculateDays(now, expiredAt);
                
                // 从订阅记录中获取 duration，而不是根据天数判断
                return {
                    isSubscribed: true,
                    expiredAt,
                    remainingDays: remainingDays > 0 ? remainingDays : 0,
                    planLevel: activeSubscription.planId,
                    duration: activeSubscription.duration // 直接使用保存的 duration
                };
            }
            
            return { isSubscribed: false };
        } catch (error) {
            logger.error('获取订阅状态失败:', error);
            return { isSubscribed: false };
        }
    }

    static async createTonPaymentRecord(
        uid: string,
        userEmail: string,
        orderId: string,
        amount: number,
        tonAmount: number,
        duration: string,
        planId: 'trial' | 'basic' | 'pro' | 'premium'
    ): Promise<void> {
        try {
            logger.debug('创建 TON 支付记录:', {
                uid,
                userEmail,
                orderId,
                amount,
                tonAmount,
                duration,
                planId
            });

            const now = new Date();
            // 根据 duration 计算到期时间
            const durationMap = {
                'monthly': 30,
                'quarterly': 90,
                'yearly': 365,
                'lifetime': 36500 // 100年作为终身
            };
            const days = durationMap[duration as keyof typeof durationMap] || 30;
            const expiredAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

            const paymentRecord: PaymentRecord = {
                uid,
                userEmail,
                orderId,
                amount,
                currency: 'USD',
                tonAmount, // TON 特有字段
                paymentChannel: 'ton',
                status: 'pending',
                planId,
                duration,
                createdAt: now,
                expiredAt,
                metadata: {
                    network: import.meta.env.VITE_TON_NETWORK,
                    walletAddress: import.meta.env.VITE_TON_TEST_WALLET_ADDRESS
                }
            };

            await this.createPaymentRecord(paymentRecord);
            logger.debug('TON支付记录已创建:', paymentRecord);
        } catch (error) {
            logger.error('创建TON支付记录失败:', error);
            throw error;
        }
    }

    static async handleTonPaymentSuccess(
        orderId: string, 
        walletAddress: string
    ): Promise<void> {
        try {
            logger.debug('处理TON支付成功:', { orderId, walletAddress });
            
            // 更新支付状态
            await this.updatePaymentStatus(orderId, 'completed');
            
            // 更新支付账户信息
            await this.updatePaymentWithAccountInfo(
                orderId,
                walletAddress,
                'ton',
                'completed'
            );

            // 获取更新后的记录
            const updatedRecord = await this.getPaymentRecordByOrderId(orderId);
            
            if (updatedRecord) {
                // 触发订阅更新事件
                window.dispatchEvent(new CustomEvent('subscription-updated', {
                    detail: {
                        orderId,
                        uid: updatedRecord.uid,
                        userEmail: updatedRecord.userEmail,
                        expiredAt: updatedRecord.expiredAt,
                        paymentChannel: 'ton',
                        walletAddress
                    }
                }));
            }
        } catch (error) {
            logger.error('处理TON支付成功失败:', error);
            throw error;
        }
    }

    static async getTonPaymentByWalletAddress(
        walletAddress: string
    ): Promise<PaymentRecord | null> {
        try {
            const paymentsRef = collection(db, 'paymentRecords');
            const q = query(
                paymentsRef,
                where('paymentChannel', '==', 'ton'),
                where('paymentAccount', '==', walletAddress),
                where('status', '==', 'completed'),
                orderBy('createdAt', 'desc'),
                limit(1)
            );

            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return {
                    id: doc.id,
                    ...doc.data(),
                    createdAt: new Date(doc.data().createdAt),
                    expiredAt: new Date(doc.data().expiredAt),
                    completedAt: doc.data().completedAt ? new Date(doc.data().completedAt) : undefined
                } as PaymentRecord;
            }
            return null;
        } catch (error) {
            logger.error('获取TON支付记录失败:', error);
            return null;
        }
    }
}