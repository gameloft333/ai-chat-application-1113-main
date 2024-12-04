import { db } from '../config/firebase-config';
import { collection, doc, setDoc, getDoc, query, where, getDocs, updateDoc, addDoc, limit, orderBy } from 'firebase/firestore';
import { PaymentRecord, PaymentChannel } from '../types/payment';

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
            console.error('获取支付记录失败:', error);
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
        try {
            if (!uid) {
                console.warn('getActiveSubscription: uid is undefined');
                return null;
            }

            const paymentsRef = collection(db, 'paymentRecords');
            // 使用正确的索引顺序
            const q = query(
                paymentsRef,
                where('status', '==', 'completed'),
                where('uid', '==', uid),
                orderBy('expiredAt', 'desc'),
                limit(1)  // 只获取最新的一条记录
            );

            const querySnapshot = await getDocs(q);
            const now = new Date();

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                const record = {
                    id: doc.id,
                    ...doc.data(),
                    createdAt: new Date(doc.data().createdAt),
                    expiredAt: new Date(doc.data().expiredAt),
                    completedAt: doc.data().completedAt ? new Date(doc.data().completedAt) : undefined
                } as PaymentRecord;

                // 只返回未过期的订阅
                if (record.expiredAt > now) {
                    console.log('找到有效订阅:', record);
                    return record;
                }
            }
            return null;
        } catch (error) {
            console.error('获取活跃订阅失败:', error);
            return null;
        }
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

    static async handlePaymentSuccess(orderId: string, paymentAccount: string): Promise<void> {
        try {
            // 先更新支付状态
            await this.updatePaymentStatus(orderId, 'completed', paymentAccount);
            
            // 获取更新后的记录
            const updatedRecord = await this.getPaymentRecordByOrderId(orderId);
            
            if (updatedRecord) {
                console.log('支付成功，更新后的记录:', updatedRecord);
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
            console.error('处理支付成功失败:', error);
            throw error;
        }
    }

    static async getSubscriptionStatus(uid: string, userEmail?: string): Promise<SubscriptionStatus> {
        try {
            console.log('开始查询订阅状态:', { uid, userEmail });
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
                    
                    console.log('天数计算详情:', {
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
            console.error('获取订阅状态失败:', error);
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
            console.log('创建 TON 支付记录:', {
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
            console.log('TON支付记录已创建:', paymentRecord);
        } catch (error) {
            console.error('创建TON支付记录失败:', error);
            throw error;
        }
    }

    static async handleTonPaymentSuccess(
        orderId: string, 
        walletAddress: string
    ): Promise<void> {
        try {
            console.log('处理TON支付成功:', { orderId, walletAddress });
            
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
            console.error('处理TON支付成功失败:', error);
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
            console.error('获取TON支付记录失败:', error);
            return null;
        }
    }
}