interface SubscriptionStatus {
    isSubscribed: boolean;
    expiredAt?: Date;
    remainingDays?: number;
    planLevel?: string;
    duration?: string;  // 添加 duration 字段
}