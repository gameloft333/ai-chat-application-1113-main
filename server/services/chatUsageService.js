import { supabaseAdmin } from '../index.js';

/**
 * Retrieves or creates a chat usage record for a user on a specific date.
 * @param {string} userId - The UUID of the user.
 * @param {string} date - The date in 'YYYY-MM-DD' format (UTC).
 * @returns {Promise<object>} The chat usage record { user_id, date, used_count }.
 * @throws {Error} If there's an issue with database interaction.
 */
const getOrCreateChatUsage = async (userId, date) => {
    if (!userId || !date) {
        throw new Error('User ID and date are required for getOrCreateChatUsage.');
    }

    try {
        // Check if a record for this user and date already exists
        let { data: usageRecord, error: selectError } = await supabaseAdmin
            .from('chat_usage')
            .select('user_id, date, used_count')
            .eq('user_id', userId)
            .eq('date', date)
            .single();

        if (selectError && selectError.code !== 'PGRST116') { // PGRST116: Row not found
            console.error('[ChatUsageService] Error selecting chat usage:', selectError);
            throw selectError;
        }

        if (usageRecord) {
            return usageRecord;
        } else {
            // No record found, create a new one
            const { data: newRecord, error: insertError } = await supabaseAdmin
                .from('chat_usage')
                .insert({ user_id: userId, date: date, used_count: 0 })
                .select('user_id, date, used_count')
                .single();

            if (insertError) {
                console.error('[ChatUsageService] Error inserting new chat usage record:', insertError);
                throw insertError;
            }
            return newRecord;
        }
    } catch (error) {
        console.error('[ChatUsageService] Exception in getOrCreateChatUsage:', error);
        throw error; // Re-throw the error to be handled by the caller
    }
};

/**
 * Increments the chat usage count for a user on a specific date.
 * @param {string} userId - The UUID of the user.
 * @param {string} date - The date in 'YYYY-MM-DD' format (UTC).
 * @returns {Promise<object>} The updated chat usage record.
 * @throws {Error} If there's an issue updating the record.
 */
const incrementChatUsage = async (userId, date) => {
    if (!userId || !date) {
        throw new Error('User ID and date are required for incrementChatUsage.');
    }
    try {
        // Ensure the record exists first by calling getOrCreateChatUsage
        const currentUsageRecord = await getOrCreateChatUsage(userId, date);
        if (!currentUsageRecord) {
            // This case should ideally be handled by getOrCreateChatUsage throwing an error
            console.error(`[ChatUsageService] Failed to get or create usage record for user ${userId}, date ${date} before increment.`);
            throw new Error('Failed to retrieve chat usage record before increment.');
        }

        const newUsedCount = (currentUsageRecord.used_count || 0) + 1;

        // Increment the used_count
        const { data: updatedRecord, error } = await supabaseAdmin
            .from('chat_usage')
            .update({ used_count: newUsedCount })
            .eq('user_id', userId)
            .eq('date', date)
            .select('user_id, date, used_count')
            .single();

        if (error) {
            console.error('[ChatUsageService] Error incrementing chat usage:', error);
            throw error;
        }
        if (!updatedRecord) {
            // This should ideally not happen if getOrCreateChatUsage was successful
            console.error('[ChatUsageService] Failed to get updated record after increment for user:', userId, 'date:', date);
            throw new Error('Failed to update chat usage record after increment.');
        }
        return updatedRecord;
    } catch (error) {
        console.error('[ChatUsageService] Exception in incrementChatUsage:', error);
        throw error;
    }
};

/**
 * Fetches the subscription status and expiration date for a user.
 * Assumes these details are stored in the 'public.users' table.
 * @param {string} userId - The UUID of the user (from auth.users, which links to public.users.id).
 * @returns {Promise<{subscription_status: string, subscription_expires_at: string | null} | null>}
 *          The subscription details or null if user not found or on error.
 */
const getUserSubscriptionStatus = async (userId) => {
    if (!userId) {
        console.warn('[ChatUsageService] getUserSubscriptionStatus called without userId.');
        return null;
    }
    try {
        const { data: user, error } = await supabaseAdmin
            .from('users') // public.users table
            .select('subscription_status, subscription_expires_at')
            .eq('id', userId) // Assuming public.users.id is the same as auth.uid()
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // User not found in public.users
                console.warn(`[ChatUsageService] User not found in public.users for id: ${userId}`);
                return null; 
            }
            console.error('[ChatUsageService] Error fetching user subscription status:', error);
            return null; // Or throw error, depending on how critical this info is for the caller
        }
        return user;
    } catch (error) {
        console.error('[ChatUsageService] Exception in getUserSubscriptionStatus:', error);
        return null; // Or throw
    }
};

export {
    getOrCreateChatUsage,
    incrementChatUsage,
    getUserSubscriptionStatus
}; 