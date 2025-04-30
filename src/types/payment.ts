export interface TelegramPayment {
    id: string;
    status: 'pending' | 'completed' | 'failed';
    amount: number;
    currency: string;
    userId: string;
    subscriptionType: 'monthly' | 'yearly';
    createdAt: Date;
    updatedAt: Date;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    duration: 'monthly' | 'yearly';
    features: string[];
}

export type PaymentChannel = 'paypal' | 'telegram' | 'stripe' | 'alipay' | 'wechat' | 'ton';

export type SubscriptionDuration = 'monthly' | 'quarterly' | 'yearly' | 'lifetime';

export interface PaymentRecord {
    id?: string;
    uid: string;
    planId: string;
    orderId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'cancelled' | 'failed';
    createdAt: Date;
    expiredAt: Date;
    completedAt?: Date;
    paymentAccount?: string;
    userEmail?: string;
    paymentChannel: PaymentChannel;
    duration: SubscriptionDuration;
    tonAmount?: number;
    metadata?: {
        network?: string;
        walletAddress?: string;
    };
}