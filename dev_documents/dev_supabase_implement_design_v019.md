
Okay, I understand the goal is to integrate Supabase for data storage alongside the existing Firebase authentication (specifically Google Auth) in your React project. We need to ensure users authenticated via Firebase are synced to the Supabase `users` table, following the provided database design and development rules, without disrupting the current application flow.

Here is a detailed design plan for implementing Supabase support:

**Phase 1: Setup and User Synchronization**

1.  **Environment Configuration (Rule #1, #18):**
    *   Retrieve the Supabase Project URL and Anon Key from `dev_documents/dev_supabase_key.md`.
    *   Add the following variables to your environment files (`.env.development`, `.env.production`, `.env.test`):
        ```
        VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
        VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```
    *   Update `.env.example` to include these new variables with placeholder values.

2.  **Supabase Client Initialization (Rule #3):**
    *   Create a new file: `src/services/supabaseClient.ts`.
    *   Inside this file, initialize and export the Supabase client using the environment variables:
        ```typescript
        import { createClient } from '@supabase/supabase-js';

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          console.error("Supabase URL or Anon Key is missing in environment variables.");
          // Optionally throw an error or handle this case appropriately
        }

        export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

        console.log("Supabase client initialized."); // Debug log (Rule #4)
        ```
    *   Ensure necessary types are installed: `npm install @supabase/supabase-js` (Rule #24).

3.  **User Service for Supabase Interaction (Rule #3):**
    *   Create a new file: `src/services/userService.ts`.
    *   Define a function `syncUserToSupabase` responsible for creating or updating user records in Supabase based on Firebase authentication data.
    *   This function will accept Firebase user details (UID, email, display name, photo URL) as arguments.
    *   **Function Logic (`syncUserToSupabase`):**
        *   **Input:** `firebaseUser: { uid: string, email: string | null, displayName: string | null, photoURL: string | null }`
        *   **Query Supabase:** Use the `supabase` client to query the `users` table (`select('*').eq('firebase_uid', firebaseUser.uid).single()`). This attempts to find an existing user linked to the Firebase UID. Referencing `dev_supabase_db_design_v018.md` for the `firebase_uid` column.
        *   **Handle Errors:** Wrap Supabase calls in try/catch blocks and log errors (Rule #4).
        *   **User Exists (No Error and `data` is not null):**
            *   Log: "User found in Supabase, updating last login."
            *   Prepare update data: `{ last_login_at: new Date().toISOString() }`. Optionally include updated `email`, `username`, `avatar_url` if they differ and you want to sync changes.
            *   Call `supabase.from('users').update(updateData).eq('firebase_uid', firebaseUser.uid)`.
            *   Return the existing Supabase user data.
        *   **User Doesn't Exist (Error indicates no rows or `data` is null):**
            *   Log: "User not found in Supabase, creating new record."
            *   Prepare insert data according to `dev_supabase_db_design_v018.md`:
                ```typescript
                const newUser = {
                  firebase_uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User', // Fallback logic
                  avatar_url: firebaseUser.photoURL,
                  last_login_at: new Date().toISOString(),
                  subscription_status: 'normal', // Or 'trial' based on business logic
                  subscription_expires_at: null, // Or trial end date
                  metadata: {}, // Default empty metadata
                  // id, created_at, updated_at are handled by Supabase
                };
                ```
            *   Call `supabase.from('users').insert(newUser).select().single()`.
            *   Return the newly created Supabase user data.
        *   **Other Errors:** Log the error and potentially return null or throw the error.
    *   **Type Definitions (Rule #2):** Define necessary TypeScript interfaces for user data (e.g., `SupabaseUser`, `FirebaseUser`). Place these in `src/types/`.

4.  **Modify Authentication Flow (Rule #6, #7):**
    *   Locate the component or context responsible for handling Firebase authentication callbacks (e.g., wherever `onAuthStateChanged` or the Google Sign-In success handler resides, potentially in `src/contexts/AuthContext.tsx` or a similar file).
    *   **Crucially, do NOT remove the existing Firebase auth logic.**
    *   **After** successfully obtaining the Firebase user object (`user` from Firebase Auth):
        *   Check if `user` is not null.
        *   Call `syncUserToSupabase` with the relevant Firebase user details (`user.uid`, `user.email`, `user.displayName`, `user.photoURL`).
        *   Log: "Attempting to sync Firebase user to Supabase..."
        *   Store the returned Supabase user profile (or at least the Supabase `id` and `firebase_uid`) alongside the Firebase user object in your application's authentication state (e.g., within the Auth Context). This makes the Supabase `id` available for subsequent data operations.
        *   Handle potential errors during the sync process gracefully (e.g., log the error but potentially allow the user to proceed with limited functionality if Supabase sync fails, depending on requirements).

**Phase 2: Data Management Integration (Planning for future steps)**

5.  **Data Access Layer for Supabase:**
    *   Plan to create dedicated services or hooks for interacting with other Supabase tables (`conversations`, `messages`, `payments`, etc.) as defined in `dev_supabase_db_design_v018.md`.
    *   Examples:
        *   `src/services/conversationService.ts` with functions like `fetchConversations(supabaseUserId)`, `createConversation(...)`.
        *   `src/hooks/useMessages.ts` for fetching and subscribing to messages for a specific conversation ID.
    *   These will use the `supabase` client and rely on the Supabase `user.id` stored in the auth state.

6.  **Gradual Refactoring:**
    *   Identify existing code that fetches/saves data (chats, user settings, etc.) potentially using Firebase Realtime Database/Firestore.
    *   Plan to refactor these sections *incrementally*, replacing Firebase data operations with calls to the new Supabase services/hooks (from step 5). Start with less critical features or new features first.

7.  **Backend Considerations (If Applicable):**
    *   If your Node.js backend currently interacts with Firebase for data, plan similar steps:
        *   Add Supabase credentials (likely Service Role Key) to backend environment variables.
        *   Initialize a Supabase client in the backend (`supabase-js` works server-side too).
        *   Refactor backend services to use Supabase for data persistence instead of or alongside Firebase, passing the correct user context (Supabase user ID).

**Phase 3: Documentation and Testing**

8.  **Documentation Update (Rule #12, #33):**
    *   Update `README.md`:
        *   Add Supabase to the "Technology Stack" section.
        *   Explain the dual Firebase (Auth) + Supabase (Data) architecture.
        *   Document the new environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the "Environment & Configuration" section.
        *   Briefly mention the `userService.ts` and `supabaseClient.ts`.
    *   Update `dev_rule_v017.md` if any new specific patterns emerge (e.g., naming conventions for Supabase hooks/services).

9.  **Testing Strategy:**
    *   **Unit Tests:** Test the `syncUserToSupabase` function with mock Firebase user data and mock Supabase client responses.
    *   **Integration Tests:** Test the full Google Sign-In flow, verifying:
        *   Firebase authentication completes successfully.
        *   `syncUserToSupabase` is called.
        *   The correct user record exists or is created/updated in the actual Supabase `users` table.
        *   The Supabase user ID is correctly stored in the application state.
    *   **Regression Tests:** Ensure existing functionalities (especially those not yet migrated) still work as expected.

This design focuses on the initial integration and user synchronization layer. Once this is approved and implemented, we can proceed with migrating specific data management features to Supabase.

Please review this plan. If it aligns with your expectations, respond with "**GO WITH IMPLEMENT**" and I will proceed with the code changes for Phase 1 (Steps 1-4).
