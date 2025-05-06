import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';

// --- ES Module way to get __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- End ES Module __dirname fix ---

// Load environment variables (adjust path if needed)
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : process.env.NODE_ENV === 'test'
    ? '.env.test'
    : '.env.development';
const envPath = path.resolve(__dirname, '..', envFile);
console.log('Loading environment from:', envPath);
dotenv.config({ path: envPath });

// Debug: Log loaded environment variables
console.log('Environment variables loaded:', {
  VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID ? 'Set' : 'Not Set',
  PROJECT_URL: process.env.PROJECT_URL ? 'Set' : 'Not Set',
  FUNC_SUPABASE_SERVICE_ROLE_KEY: process.env.FUNC_SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not Set'
});

// --- Configuration ---
// Path to your Firebase service account key JSON file
const absoluteServiceAccountPath = path.resolve(__dirname, '..', 'dev_documents', 'client_secret_24543110719-i7vbt20sun58p19tb8v8aaugja3eief4.apps.googleusercontent.com.json');
const SERVICE_ACCOUNT_URL = pathToFileURL(absoluteServiceAccountPath).href;

const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
const SUPABASE_URL = process.env.PROJECT_URL;
const SUPABASE_SERVICE_KEY = process.env.FUNC_SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!FIREBASE_PROJECT_ID || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: Missing required environment variables:');
    console.error('- VITE_FIREBASE_PROJECT_ID:', FIREBASE_PROJECT_ID ? 'Set' : 'Not Set');
    console.error('- PROJECT_URL:', SUPABASE_URL ? 'Set' : 'Not Set');
    console.error('- FUNC_SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? 'Set' : 'Not Set');
    process.exit(1);
}

if (!SERVICE_ACCOUNT_URL) {
    console.error('Error: SERVICE_ACCOUNT_URL is not set');
    process.exit(1);
}

// Initialize Firebase Admin SDK
try {
    console.log(`Attempting to import service account from: ${SERVICE_ACCOUNT_URL}`);
    const serviceAccountModule = await import(SERVICE_ACCOUNT_URL, { assert: { type: 'json' } });
    const serviceAccount = serviceAccountModule.default;

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: FIREBASE_PROJECT_ID,
    });
    console.log('Firebase Admin SDK Initialized successfully');
} catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    console.error("Please ensure SERVICE_ACCOUNT_URL is correct and the file exists.");
    process.exit(1);
}


// Initialize Supabase Admin Client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
console.log('Supabase Admin Client Initialized.');

async function backfillUsers() {
    console.log('Starting user backfill...');
    let firebaseUsers = [];
    let nextPageToken;
    let processedCount = 0;
    let skippedCount = 0;
    let createdCount = 0;
    let errorCount = 0;

    try {
        // List all users from Firebase Auth
        console.log('Fetching users from Firebase Authentication...');
        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            firebaseUsers = firebaseUsers.concat(listUsersResult.users);
            nextPageToken = listUsersResult.pageToken;
            console.log(`Fetched ${firebaseUsers.length} users so far...`);
        } while (nextPageToken);

        console.log(`Total Firebase users fetched: ${firebaseUsers.length}`);

        // Process each Firebase user
        for (const fbUser of firebaseUsers) {
            processedCount++;
            console.log(`\nProcessing user ${processedCount}/${firebaseUsers.length}: ${fbUser.email} (Firebase UID: ${fbUser.uid})`);

            try {
                // 1. Check if user exists in public.users by firebase_uid
                const { data: existingPublicUser, error: selectError } = await supabaseAdmin
                    .from('users')
                    .select('id, email, firebase_uid')
                    .eq('firebase_uid', fbUser.uid)
                    .maybeSingle();

                if (selectError) {
                    console.error(`  Error checking public.users for ${fbUser.uid}:`, selectError.message);
                    errorCount++;
                    continue; // Skip to next user on error
                }

                if (existingPublicUser) {
                    console.log(`  Skipping: User already exists in public.users with firebase_uid ${fbUser.uid} (Supabase ID: ${existingPublicUser.id}).`);
                    skippedCount++;
                    continue;
                }

                // 2. User does NOT exist by firebase_uid. We need to insert them into public.users.
                // We first need the corresponding Supabase auth.users ID.
                console.log(`  User not found by firebase_uid. Checking Supabase Auth for email: ${fbUser.email}`);

                const { data: { users: authUsers }, error: authListError } = await supabaseAdmin.auth.admin.listUsers({
                     filter: `email = "${fbUser.email}"` // Ensure email is quoted
                });

                let supabaseAuthUserId = null;

                if (authListError && authListError.message !== "No users found matching the provided criteria.") {
                    console.error(`  Error searching Supabase auth for email ${fbUser.email}:`, authListError);
                     // Decide if you want to continue or stop? For now, log and skip.
                     errorCount++;
                     continue;
                 }


                if (authUsers && authUsers.length > 0) {
                    supabaseAuthUserId = authUsers[0].id;
                    console.log(`  Found existing Supabase auth user by email: ${supabaseAuthUserId}`);
                } else {
                     // OPTIONAL: Create user in Supabase Auth if they don't exist.
                     // Usually, you only create in public.users linked by firebase_uid if Firebase is the source.
                     // If you NEED them in auth.users, uncomment and test carefully.
                     /*
                     console.log(`  Creating user in Supabase Auth for email: ${fbUser.email}`);
                     const { data: { user: newAuthUser }, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
                         email: fbUser.email,
                         email_confirm: true, // Or false depending on your flow
                     });
                     if (createAuthError) {
                         console.error(`  Error creating Supabase auth user for ${fbUser.email}:`, createAuthError);
                         errorCount++;
                         continue;
                     }
                     supabaseAuthUserId = newAuthUser.id;
                     console.log(`  Created new Supabase auth user: ${supabaseAuthUserId}`);
                     */
                    // If not creating in auth.users, we cannot link `public.users.id` to `auth.users.id`
                    // The schema needs adjustment if firebase_uid is the *only* link
                    console.warn(`  WARNING: User ${fbUser.email} exists in Firebase but not in Supabase Auth.`);
                    console.warn(`           Cannot insert into public.users because the 'id' column MUST reference 'auth.users.id'.`);
                    console.warn(`           Consider adjusting the public.users schema or ensuring users exist in Supabase Auth first.`);
                    errorCount++; // Count as an error/issue
                    continue; // Skip this user
                }

                 // 3. Insert into public.users, linking via supabaseAuthUserId
                console.log(`  Inserting into public.users for Supabase ID: ${supabaseAuthUserId}`);
                const insertData = {
                    id: supabaseAuthUserId, // Link to the auth.users table
                    firebase_uid: fbUser.uid,
                    email: fbUser.email || 'missing@example.com', // Provide a fallback if email is missing
                    username: fbUser.displayName || fbUser.email?.split('@')[0] || `user_${fbUser.uid.substring(0, 6)}`,
                    avatar_url: fbUser.photoURL,
                    created_at: fbUser.metadata.creationTime ? new Date(fbUser.metadata.creationTime).toISOString() : new Date().toISOString(),
                    last_login_at: fbUser.metadata.lastSignInTime ? new Date(fbUser.metadata.lastSignInTime).toISOString() : null,
                    subscription_status: 'normal', // Default status
                    subscription_expires_at: null,
                     metadata: { provider: 'firebase', backfilled: true } // Add some metadata
                };

                 // Use upsert maybe? No, insert because we check existence first.
                const { data: insertedUser, error: insertError } = await supabaseAdmin
                    .from('users')
                    .insert(insertData)
                    .select('id')
                    .single();

                if (insertError) {
                    // Handle potential conflict if somehow the user was created between check and insert
                    if (insertError.code === '23505') { // Unique violation
                         console.warn(`  Conflict: User likely created concurrently. Skipping insertion for ${fbUser.uid}. Code: ${insertError.code}`);
                         skippedCount++;
                     } else {
                        console.error(`  Error inserting into public.users for ${fbUser.uid}:`, insertError);
                        errorCount++;
                    }
                    continue;
                }

                console.log(`  Successfully inserted user into public.users (Supabase ID: ${insertedUser?.id})`);
                createdCount++;

            } catch (userError) {
                console.error(`  Unhandled error processing user ${fbUser.uid}:`, userError);
                errorCount++;
            }
        }

        console.log('\n--- Backfill Summary ---');
        console.log(`Total Firebase Users: ${firebaseUsers.length}`);
        console.log(`Processed:            ${processedCount}`);
        console.log(`Already Existed:      ${skippedCount}`);
        console.log(`Newly Created:        ${createdCount}`);
        console.log(`Errors / Skipped:     ${errorCount}`);
        console.log('--- Backfill Complete ---');

    } catch (error) {
        console.error('\nFATAL ERROR during backfill process:', error);
    }
}

// Run the backfill
backfillUsers();
