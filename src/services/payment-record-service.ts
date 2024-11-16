import { db } from '../config/firebase-config';
import { collection, doc, setDoc, getDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { PaymentRecord } from '../types/payment';

export class PaymentRecordService {
    private static COLLECTION = 'payments';

    static async createPaymentRecord(record: PaymentRecord): Promise<void> {
        const paymentRef = doc(db, this.COLLECTION, record.transactionId || crypto.randomUUID());
        await setDoc(paymentRef, {
            ...record,
            createdAt: new Date(),
            expiredAt: record.expiredAt
        });
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
        status: 'completed' | 'failed' | 'pending'
    ): Promise<void> {
        const paymentsRef = collection(db, this.COLLECTION);
        const q = query(paymentsRef, where('orderId', '==', orderId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const docRef = doc(db, this.COLLECTION, querySnapshot.docs[0].id);
            await updateDoc(docRef, { status });
        }
    }
}