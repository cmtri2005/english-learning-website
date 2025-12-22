/**
 * Google Sign-In Hook
 * 
 * Handles Google Sign-In flow using Firebase Auth.
 * After Firebase auth, sends ID token to backend for verification and JWT generation.
 */

import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/client/auth-store';
import { useNavigate } from 'react-router-dom';

export function useGoogleSignIn() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { setUser, initialize } = useAuthStore();
    const navigate = useNavigate();

    const signInWithGoogle = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Step 1: Firebase Google Sign-In popup
            const result = await signInWithPopup(auth, googleProvider);

            // Step 2: Get Firebase ID token
            const idToken = await result.user.getIdToken();

            // Step 3: Send ID token to backend for verification
            const response = await api.googleLogin(idToken);

            if (response.success && response.data) {
                // Step 4: Save JWT token and user data
                api.setToken(response.data.token);
                setUser(response.data.user);
                initialize();

                // Navigate to home or dashboard
                navigate('/');
            } else {
                setError(response.message || 'Đăng nhập Google thất bại');
            }
        } catch (err: any) {
            console.error('Google Sign-In error:', err);

            // Handle specific Firebase errors
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Đăng nhập bị hủy');
            } else if (err.code === 'auth/popup-blocked') {
                setError('Popup bị chặn. Vui lòng cho phép popup.');
            } else if (err.code === 'auth/cancelled-popup-request') {
                // User opened another popup, ignore
                return;
            } else {
                setError(err.message || 'Đã xảy ra lỗi khi đăng nhập với Google');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return {
        signInWithGoogle,
        isLoading,
        error,
    };
}
