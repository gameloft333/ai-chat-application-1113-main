export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    createdAt: Date;
    lastLoginAt: Date;
    preferences?: {
        theme?: 'light' | 'dark';
        language?: string;
        notifications?: boolean;
    };
}