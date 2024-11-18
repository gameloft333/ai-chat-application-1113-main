import { db } from '../config/firebase-config';
import { collection, doc, setDoc, getDoc, query, where, getDocs, updateDoc, addDoc, limit } from 'firebase/firestore';
import { PaymentRecord, PaymentChannel } from '../types/payment';

export class PaymentRecordService {
    private static COLLECTION = 'payments';

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
            const updateData = { ...data };
            
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

        return querySnapshot.docs.map(doc => ({
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
            expiredAt: doc.data().expiredAt.toDate()
        } as PaymentRecord));
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
}