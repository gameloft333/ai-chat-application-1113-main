import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    Auth,
    User as FirebaseUserAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase-config';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { supabase } from '../services/supabaseClient';

// Define SupabaseUser type here or move to a central types file (e.g., src/types/user.ts)
export interface SupabaseUser {
  id: string;
  firebase_uid: string | null;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  subscription_status: string | null;
  subscription_expires_at: string | null;
  metadata: Record<string, any> | null;
}

interface User {
    uid: string;
    email: string;
    isPaid?: boolean;
    expiredAt?: string | Date;
    planId?: string;
}

interface AuthContextType {
    currentUser: FirebaseUserAuth | null;
    supabaseProfile: SupabaseUser | null;
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
    const [currentUser, setCurrentUser] = useState<FirebaseUserAuth | null>(null);
    const [supabaseProfile, setSupabaseProfile] = useState<SupabaseUser | null>(null);
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
        console.log('[AuthContext] Setting up onAuthStateChanged listener...');
        const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUserAuth | null) => {
            console.log('[AuthContext] onAuthStateChanged triggered. User:', user?.uid || 'null');
            setCurrentUser(user);

            if (user) {
                console.log(`[AuthContext] User ${user.uid} detected, processing...`);
                setLoading(true);
                let firestoreSuccess = false;
                try {
                    // --- Firestore Profile Creation/Update --- 
                    const userProfileRef = doc(db, "userProfiles", user.uid);
                    try {
                        console.log(`[AuthContext] Trying Firestore setDoc for ${user.uid}...`);
                        await setDoc(userProfileRef, {
                            email: user.email,
                            displayName: user.displayName || user.email?.split('@')[0] || 'New User',
                            uid: user.uid,
                            createdAt: serverTimestamp(),
                            tokens: 0 
                        }, { merge: true });
                        console.log(`[AuthContext] Firestore profile set/updated successfully for ${user.uid}`);
                        firestoreSuccess = true;
                    } catch (firestoreError) {
                        console.error(`[AuthContext] !!! Firestore setDoc failed for ${user.uid}:`, firestoreError);
                        // Continue even if Firestore fails for now
                    }
                    // --- End Firestore --- 

                    // --- Supabase Sync via Backend API --- 
                    console.log(`[AuthContext] Attempting Supabase sync via Backend API for ${user.uid}...`);
                    let idToken: string | null = null;
                    try {
                        idToken = await user.getIdToken(); // Get Firebase ID Token
                    } catch (tokenError) {
                        console.error('[AuthContext] Failed to get Firebase ID token:', tokenError);
                        throw new Error('Failed to get authentication token.'); 
                    }

                    if (idToken) {
                        // Determine the backend API URL based on environment
                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'; 
                        try {
                            const response = await fetch(`${apiUrl}/api/sync-user`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    // Include Authorization header if your API requires it later
                                    // 'Authorization': `Bearer ${idToken}` 
                                },
                                body: JSON.stringify({ idToken })
                            });

                            const profile = await response.json();

                            if (!response.ok) {
                                console.error(`[AuthContext] Backend API /api/sync-user returned error ${response.status}:`, profile.error || 'Unknown error', profile.details);
                                throw new Error(profile.error || 'Backend sync failed');
                            } 

                            setSupabaseProfile(profile as SupabaseUser | null); // Store the result
                            if (profile) {
                                console.log(`[AuthContext] Backend API sync successful. Supabase ID: ${(profile as SupabaseUser).id}`);
                            } else {
                                console.warn(`[AuthContext] Backend API sync returned null profile.`);
                            }

                        } catch(apiError) {
                            console.error('[AuthContext] Error calling backend /api/sync-user:', apiError);
                            setSupabaseProfile(null);
                            // Propagate or handle the error as needed
                            throw apiError;
                        }
                    } else {
                         console.error('[AuthContext] ID Token was null, cannot call backend sync API.');
                         // Handle case where token is null, maybe retry or show error
                         setSupabaseProfile(null);
                    }
                    // --- End Supabase --- 

                } catch (error) {
                    // This outer catch handles errors from getIdToken or the fetch call
                    console.error('[AuthContext] Error during token retrieval or backend API call:', error);
                    setSupabaseProfile(null); // Ensure profile is null on error
                } finally {
                    setLoading(false);
                }
            } else {
                console.log('[AuthContext] User signed out, clearing Supabase profile.');
                setSupabaseProfile(null);
                setLoading(false);
            }
        });

        return () => {
            console.log('[AuthContext] Unsubscribing from onAuthStateChanged.');
            unsubscribe();
        }
    }, []);

    const value = {
        currentUser,
        supabaseProfile,
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