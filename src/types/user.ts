export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    planLevel?: 'trial' | 'basic' | 'pro' | 'premium';
    planDuration?: '1month' | '12months' | '24months';
    expiredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    paymentHistory: PaymentRecord[];
    lastLoginAt: Date;
    preferences?: {
        theme?: 'light' | 'dark';
        language?: string;
        notifications?: boolean;
    };
}