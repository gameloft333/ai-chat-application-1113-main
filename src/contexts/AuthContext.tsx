import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    Auth,
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase-config';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase-config';

interface User {
    uid: string;
    email: string;
    isPaid?: boolean;
    expiredAt?: string | Date;
    planId?: string;
}

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (uid: string, data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            const result = await signInWithPopup(auth, provider);
            if (!result.user) {
                throw new Error('登录失败：未能获取用户信息');
            }
        } catch (error: any) {
            if (error.code === 'auth/unauthorized-domain') {
                throw new Error('当前域名未授权，请联系管理员添加授权域名');
            }
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('登录已取消');
            }
            console.error('Google登录错误:', error);
            throw new Error('登录失败，请稍后重试');
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUpWithEmail = async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('chatHistory');
        } catch (error) {
            console.error('退出登录错误:', error);
            throw new Error('退出登录失败，请稍后重试');
        }
    };

    const updateUser = async (uid: string, data: Partial<User>) => {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, data);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};