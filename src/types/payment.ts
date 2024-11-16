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

export interface PaymentRecord {
    uid: string;
    planId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: Date;
    expiredAt: Date;
    transactionId?: string;
}