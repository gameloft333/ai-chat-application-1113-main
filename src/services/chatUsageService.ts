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
        let errorResponseMessage = `Failed to fetch chat usage details. Status: ${response.status}`;
        try {
            // Try to parse potential JSON error from backend
            const errorData = await response.json();
            errorResponseMessage = errorData.message || errorResponseMessage;
            console.error('[ChatUsageService] Error fetching chat usage (JSON parsed):', response.status, errorData);
        } catch (e) {
            // Could not parse JSON, likely an HTML error page
            const textResponse = await response.text(); // Read the response as text
            console.error('[ChatUsageService] Error fetching chat usage (non-JSON response):', response.status, textResponse.substring(0, 200));
            // errorResponseMessage remains the generic one based on status
        }
        throw new Error(errorResponseMessage);
    }

    // If response.ok, we expect JSON
    try {
        return await response.json();
    } catch (e) {
        const textResponse = await response.text();
        console.error('[ChatUsageService] Failed to parse successful response as JSON for getTodaysChatUsage. Status:', response.status, 'Response text:', textResponse.substring(0,200));
        throw new Error(`Received non-JSON response from server when fetching chat usage, though status was OK. Content: ${textResponse.substring(0,100)}`);
    }
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

    if (!response.ok) {
        let errorResponseMessage = `Failed to increment chat usage. Status: ${response.status}`;
        let backendErrorCode: string | undefined = `HTTP_${response.status}`;
        let currentUsageData;

        try {
            // Try to parse potential JSON error from backend
            const errorData = await response.json();
            errorResponseMessage = errorData.message || errorResponseMessage;
            backendErrorCode = errorData.error || backendErrorCode;
            currentUsageData = errorData.currentUsage; // if backend sends current state on 403/error
            console.error('[ChatUsageService] Error incrementing chat usage (JSON parsed):', response.status, errorData);
        } catch (e) {
            // Could not parse JSON, likely an HTML error page
            const textResponse = await response.text(); // Read the response as text
            console.error('[ChatUsageService] Error incrementing chat usage (non-JSON response):', response.status, textResponse.substring(0, 200));
            // errorResponseMessage and backendErrorCode remain based on status and initial values
        }
        
        return {
            success: false,
            message: errorResponseMessage,
            backendError: backendErrorCode,
            updatedUsage: currentUsageData
        };
    }

    // If response.ok is true, we expect JSON
    try {
        const responseData = await response.json();
        // Expecting { success: true, message: '...', updatedUsage: { ... } } from backend
        return { ...responseData, success: true }; // Ensure success is true if response.ok
    } catch (e) {
        const textResponse = await response.text();
        console.error('[ChatUsageService] Failed to parse successful response as JSON for incrementChatUsage. Status:', response.status, 'Response text:', textResponse.substring(0,200));
        return {
            success: false,
            message: `Received non-JSON response from server after incrementing, though status was OK. Content: ${textResponse.substring(0,100)}`,
            backendError: 'INVALID_SUCCESS_RESPONSE_FORMAT',
        };
    }
};

export const ChatUsageService = {
    getTodaysChatUsage,
    incrementChatUsage,
}; 