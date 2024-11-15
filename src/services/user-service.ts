import { db } from '../config/firebase-config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types/user';

export class UserService {
    static async createProfile(profile: UserProfile): Promise<void> {
        const userRef = doc(db, 'users', profile.uid);
        await setDoc(userRef, {
            ...profile,
            createdAt: new Date(),
            lastLoginAt: new Date()
        });
    }

    static async getProfile(uid: string): Promise<UserProfile | null> {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        return userDoc.exists() ? userDoc.data() as UserProfile : null;
    }

    static async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, updates);
    }
}