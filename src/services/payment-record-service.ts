import { db } from '../config/firebase-config';
import { collection, doc, setDoc, getDoc, query, where, getDocs, updateDoc, addDoc, limit, orderBy } from 'firebase/firestore';
import { PaymentRecord, PaymentChannel } from '../types/payment';

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
                paymentAccount: record.paymentAccount || ''
            });
        } catch (error) {
            console.error('创建支付记录失败:', error);
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
            console.error('更新支付记录失败:', error);
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
            console.error('更新支付账号信息失败:', error);
            throw error;
        }
    }

    static async getPaymentRecordByOrderId(orderId: string) {
        try {
            const q = query(
                collection(db, 'paymentRecords'), 
                where('orderId', '==', orderId),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: new Date(data.createdAt),
                    expiredAt: new Date(data.expiredAt),
                    completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
                    paymentAccount: data.paymentAccount || '',
                    paymentChannel: data.paymentChannel || 'paypal'
                } as PaymentRecord;
            }
            return null;
        } catch (error) {
            console.error('获取支付记录失败:', error);
            throw error;
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
        const payments = await this.getUserPayments(uid);
        const now = new Date();
        return payments.find(p =>
            p.status === 'completed' && p.expiredAt > now
        ) || null;
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
            console.error('更新支付状态失败:', error);
            throw error;
        }
    }

    static async getActiveSubscriptionByEmail(email: string): Promise<PaymentRecord | null> {
        try {
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
            console.error('获取邮箱订阅记录失败:', error);
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
            console.error('获取到期时间失败:', error);
            return null;
        }
    }

    static async handlePaymentSuccess(userId: string, days: number): Promise<void> {
        try {
            const currentSubscription = await this.getActiveSubscription(userId);
            const now = new Date();
            let expiryDate: Date;

            if (currentSubscription && currentSubscription.expiredAt > now) {
                expiryDate = new Date(currentSubscription.expiredAt);
                expiryDate.setDate(expiryDate.getDate() + days);
            } else {
                expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + days);
            }

            const paymentRecord = {
                uid: userId,
                createdAt: new Date(),
                expiredAt: expiryDate,
                status: 'completed',
                amount: days * 10,
                orderId: `order_${Date.now()}`,
                paymentChannel: 'paypal' as const
            };

            await this.createPaymentRecord(paymentRecord);

            const remainingDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            window.dispatchEvent(new CustomEvent('payment-success'));
            
            alert(`订阅成功！
            到期日期：${expiryDate.toLocaleDateString('zh-CN')}
            剩余天数：${remainingDays} 天
            
            您现在可以享受所有会员特权了！`);
        } catch (error) {
            console.error('处理支付成功失败:', error);
            throw error;
        }
    }

    static async getSubscriptionStatus(uid: string): Promise<{
        isSubscribed: boolean;
        expiredAt?: Date;
        remainingDays?: number;
    }> {
        try {
            const activeSubscription = await this.getActiveSubscription(uid);
            
            if (activeSubscription && activeSubscription.expiredAt) {
                const now = new Date();
                const expiredAt = new Date(activeSubscription.expiredAt);
                const remainingDays = Math.ceil((expiredAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                return {
                    isSubscribed: true,
                    expiredAt,
                    remainingDays: remainingDays > 0 ? remainingDays : 0
                };
            }
            
            return {
                isSubscribed: false
            };
        } catch (error) {
            console.error('获取订阅状态失败:', error);
            return {
                isSubscribed: false
            };
        }
    }
}