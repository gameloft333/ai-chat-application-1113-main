// Removed: import { AuthContextType, useAuth } from '../contexts/AuthContext'; 

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_APP_URL || '/api'; // Ensure this points to your backend server

export interface ChatUsageInfo {
    date: string;
    limit: number | 'unlimited';
    used: number;
    remaining: number | 'unlimited';
    isSubscriber: boolean;
}

export interface IncrementChatUsageResponse {
    success: boolean;
    message: string;
    updatedUsage?: ChatUsageInfo; // Optional, matches backend response
    error?: string; // For client-side error propagation, DEPRECATED in favor of backendError
    backendError?: string; // To carry specific error codes like 'chat.limit.exceeded'
}

/**
 * Fetches the current day's chat usage information for the authenticated user.
 */
const getTodaysChatUsage = async (getAccessToken: () => Promise<string | null>): Promise<ChatUsageInfo> => {
    const token = await getAccessToken();
    if (!token) {
        console.error('[ChatUsageService] No access token provided to getTodaysChatUsage.');
        throw new Error('User not authenticated. Cannot fetch chat usage.');
    }

    const response = await fetch(`${API_BASE_URL}/api/chat-usage/today`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch chat usage. Unknown error.' }));
        console.error('[ChatUsageService] Error fetching chat usage:', response.status, errorData);
        throw new Error(errorData.message || `Failed to fetch chat usage details. Status: ${response.status}`);
    }
    return response.json();
};

/**
 * Notifies the backend to increment the chat usage count for the authenticated user.
 */
const incrementChatUsage = async (getAccessToken: () => Promise<string | null>): Promise<IncrementChatUsageResponse> => {
    const token = await getAccessToken();
    if (!token) {
        console.error('[ChatUsageService] No access token provided to incrementChatUsage.');
        return { success: false, message: 'User not authenticated. Cannot increment chat usage.', backendError: 'AUTH_REQUIRED' }; 
    }

    const response = await fetch(`${API_BASE_URL}/api/chat-usage/increment`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    const responseData = await response.json();

    if (!response.ok) {
        console.error('[ChatUsageService] Error incrementing chat usage:', response.status, responseData);
        return {
            success: false,
            message: responseData.message || `Failed to increment chat usage. Status: ${response.status}`,
            backendError: responseData.error, // This is the error code from backend e.g. 'chat.limit.exceeded'
            updatedUsage: responseData.currentUsage // if backend sends current state on 403
        };
    }
    // Expecting { success: true, message: '...', updatedUsage: { ... } } from backend
    return { ...responseData, success: true }; // Ensure success is true if response.ok
};

export const ChatUsageService = {
    getTodaysChatUsage,
    incrementChatUsage,
}; 