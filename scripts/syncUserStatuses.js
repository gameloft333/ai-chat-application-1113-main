import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Determine the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root
// Assumes the script is in a subdirectory (e.g., /scripts) of the project root
const projectRoot = path.resolve(__dirname, '..'); // Go up one level from /scripts to project root

// Determine which .env file to load. Default to .env.development for scripts.
// You can set NODE_ENV in your shell to override this for other environments.
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = nodeEnv === 'production' 
  ? '.env.production'
  : nodeEnv === 'test'
    ? '.env.test'
    : '.env.development';

const envPath = path.resolve(projectRoot, envFile);

dotenv.config({ path: envPath });

console.log(`[syncUserStatuses] Attempting to load env file: ${envPath}`);
console.log(`[syncUserStatuses] NODE_ENV: ${nodeEnv}`);
console.log(`[syncUserStatuses] Supabase URL from env: ${process.env.PROJECT_URL ? 'Loaded' : 'NOT Loaded'}`);
console.log(`[syncUserStatuses] Supabase Key from env: ${process.env.FUNC_SUPABASE_SERVICE_ROLE_KEY ? 'Loaded' : 'NOT Loaded'}`);
console.log(`[syncUserStatuses] Firebase Project ID from env: ${process.env.FIREBASE_PROJECT_ID ? 'Loaded' : 'NOT Loaded'}`);

import { supabaseAdmin } from '../server/index.js'; // Adjust path to your supabaseAdmin instance

async function syncUserSubscriptionStatuses() {
  console.log('Starting one-time user subscription status sync...');
  let updatedCount = 0;
  let checkedCount = 0;
  let errorCount = 0;

  try {
    // 1. Fetch users from public.users who might need an update
    //    Primarily targeting 'normal', but you could expand this if other statuses are problematic
    const { data: usersToPotentiallyUpdate, error: fetchUsersError } = await supabaseAdmin
      .from('users')
      .select('id, email, subscription_status, subscription_expires_at')
      .or('subscription_status.eq.normal,subscription_expires_at.is.null,subscription_expires_at.lt.' + new Date().toISOString()); // Fetch users with 'normal' status OR outdated/null expiry

    if (fetchUsersError) {
      console.error('Error fetching users:', fetchUsersError.message);
      return;
    }

    if (!usersToPotentiallyUpdate || usersToPotentiallyUpdate.length === 0) {
      console.log('No users found potentially needing status updates based on initial query.');
      return;
    }

    console.log(`Found ${usersToPotentiallyUpdate.length} users to check for subscription status updates.`);

    for (const user of usersToPotentiallyUpdate) {
      checkedCount++;
      console.log(`\n[${checkedCount}/${usersToPotentiallyUpdate.length}] Checking user ID: ${user.id}, Email: ${user.email}`);
      console.log(`  Current users table status: ${user.subscription_status}, Expires: ${user.subscription_expires_at}`);

      // 2. For each user, query their most recent 'active' subscription
      const { data: activeSubscription, error: fetchSubscriptionError } = await supabaseAdmin
        .from('subscriptions')
        .select('plan_id, status, expires_at, provider_subscription_id, started_at')
        .eq('user_id', user.id)
        .eq('status', 'active') // Only consider subscriptions marked as 'active'
        .order('expires_at', { ascending: false, nullsLast: true }) // Get the one that expires latest, or never expires
        .limit(1)
        .maybeSingle();

      if (fetchSubscriptionError) {
        console.error(`  Error fetching active subscription for user ${user.id}:`, fetchSubscriptionError.message);
        errorCount++;
        continue;
      }

      if (activeSubscription) {
        const now = new Date();
        const subExpiresAt = activeSubscription.expires_at ? new Date(activeSubscription.expires_at) : null;

        // Check if the 'active' subscription is actually current (not expired)
        if (subExpiresAt && subExpiresAt < now) {
          console.log(`  User ${user.id} has an 'active' subscription (Provider ID: ${activeSubscription.provider_subscription_id || 'N/A'}) but it appears to have expired on ${activeSubscription.expires_at}.`);
          // Optional: Logic to update 'users' table to an 'expired' status if desired,
          // but for now, we focus on ensuring 'active' ones are correctly reflected.
          // If their current status in 'users' is 'normal', it will remain 'normal'.
          // If it's something else, this script won't downgrade it unless it was 'normal' initially and sub is expired.
          if (user.subscription_status !== 'normal' && user.subscription_status !== 'expired') { // Example of not downgrading non-normal active status
             console.log(`  Keeping current non-normal status ${user.subscription_status} as subscription found is expired.`);
          }
          continue;
        }

        // An active, non-expired (or non-expiring) subscription exists.
        const correctUserStatus = activeSubscription.plan_id; // e.g., 'pro', 'premium'
        const correctUserExpiresAt = activeSubscription.expires_at; // This can be null

        console.log(`  Found valid active subscription for user ${user.id}: Plan ID = ${correctUserStatus}, Expires At = ${correctUserExpiresAt || 'Never'}`);

        // Check if an update to public.users is needed
        const currentUsersExpiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at).toISOString() : null;
        const newUsersExpiresAtISO = correctUserExpiresAt ? new Date(correctUserExpiresAt).toISOString() : null;

        if (user.subscription_status !== correctUserStatus || currentUsersExpiresAt !== newUsersExpiresAtISO) {
          console.log(`    DRY RUN: Would update user ${user.id}. New status: ${correctUserStatus}, New expiry: ${correctUserExpiresAt || 'NULL'}`);
          updatedCount++; // Increment to see how many would be affected
        } else {
          console.log(`  User ${user.id} status in public.users already matches active subscription. No update needed.`);
        }
      } else {
        console.log(`  No 'active' subscription found for user ${user.id} in public.subscriptions.`);
        // If user was 'normal', they remain 'normal'.
        // If user had a non-'normal' status but no active subscription, this script won't change it.
        // You might add logic here to change their status to 'expired' or 'normal' if that's desired.
        if(user.subscription_status !== 'normal'){
            console.log(`  User ${user.id} has status ${user.subscription_status} but no active subscription. Consider manual review or further script logic if this should be changed to 'normal' or 'expired'.`);
        }
      }
    }

    console.log(`\n--- Sync Summary ---`);
    console.log(`Total users checked: ${checkedCount}`);
    console.log(`Users updated in public.users: ${updatedCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    console.log(`--------------------`);

  } catch (error) {
    console.error('An unexpected error occurred during the sync process:', error.message, error.stack);
  }
}

// Run the sync function
syncUserSubscriptionStatuses()
  .then(() => {
    console.log('Script finished execution.');
    // process.exit(0); // Uncomment if you want the script to exit explicitly
  })
  .catch(err => {
    console.error('Script failed to run:', err);
    // process.exit(1); // Uncomment for explicit error exit
  });
