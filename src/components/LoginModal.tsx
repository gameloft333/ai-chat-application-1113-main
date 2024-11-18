import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MailIcon, LockIcon, Chrome, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    themeColor: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, themeColor }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (isLogin) {
                await signInWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password);
            }
            onClose();
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setError(t('alerts.error.emailAlreadyInUse'));
            } else if (err.code === 'auth/invalid-email') {
                setError(t('alerts.error.invalidEmail'));
            } else if (err.code === 'auth/weak-password') {
                setError(t('alerts.error.weakPassword'));
            } else {
                setError(err instanceof Error ? err.message : t('alerts.error.registerFailed'));
            }
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('alerts.error.loginFailed'));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                >
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-bold text-center mb-6">
                    {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
                </h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        {error}
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="sr-only">{t('auth.email')}</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                <MailIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-lg relative block w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder={t('auth.email')}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="sr-only">{t('auth.password')}</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                <LockIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-lg relative block w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder={t('auth.password')}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white"
                        style={{ backgroundColor: themeColor }}
                    >
                        {isLogin ? t('auth.loginButton') : t('auth.registerButton')}
                    </button>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                                {t('auth.orDivider')}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleSignIn}
                        className="mt-4 w-full flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        <Chrome className="h-5 w-5" />
                        {t('auth.googleLogin')}
                    </button>
                </div>

                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                        {isLogin ? t('auth.registerPrompt') : t('auth.loginPrompt')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;