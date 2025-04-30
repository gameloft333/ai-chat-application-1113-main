/**
 * Database Verification Script
 * 
 * This script tests the Supabase database setup for the AI Chat Application.
 * Run with: node db_verification.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Verify database tables and structure
 */
async function verifyDatabase() {
  console.log('🔍 Starting database verification...');
  let errors = 0;
  let warnings = 0;

  try {
    // Test 1: Verify system_settings table exists and has data
    console.log('\n📋 Checking system_settings table...');
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1);
    
    if (settingsError) {
      console.error('❌ Error accessing system_settings:', settingsError.message);
      errors++;
    } else if (settings && settings.length === 0) {
      console.warn('⚠️ system_settings table exists but has no data');
      warnings++;
    } else {
      console.log('✅ system_settings table exists and has data');
    }

    // Test 2: Verify users table structure
    console.log('\n📋 Checking users table structure...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, subscription_status')
      .limit(1);
    
    if (userError) {
      console.error('❌ Error accessing users table:', userError.message);
      errors++;
    } else {
      console.log('✅ users table structure is valid');
    }

    // Test 3: Verify characters table and default character
    console.log('\n📋 Checking characters table and default character...');
    const { data: characters, error: charactersError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();
    
    if (charactersError) {
      console.error('❌ Error accessing default character:', charactersError.message);
      errors++;
    } else if (!characters) {
      console.warn('⚠️ Default character not found');
      warnings++;
    } else {
      console.log('✅ Default character found:', characters.name);
    }

    // Test 4: Verify relationships between tables
    console.log('\n📋 Testing table relationships...');
    
    // Create a test character if needed
    let characterId;
    if (!characters) {
      const { data: newChar, error: newCharError } = await supabase
        .from('characters')
        .insert({
          name: 'Test Character',
          gender: 'bot',
          description: 'A test character',
          is_active: true
        })
        .select()
        .single();
      
      if (newCharError) {
        console.error('❌ Could not create test character:', newCharError.message);
        errors++;
      } else {
        characterId = newChar.id;
        console.log('ℹ️ Created test character for verification');
      }
    } else {
      characterId = characters.id;
    }

    // Test character stats relationship
    if (characterId) {
      const { error: statsError } = await supabase
        .from('character_stats')
        .upsert({
          character_id: characterId,
          chat_count: 0
        });
      
      if (statsError) {
        console.error('❌ Error testing character_stats relationship:', statsError.message);
        errors++;
      } else {
        console.log('✅ character_stats relationship is valid');
      }
    }

    // Test 5: Verify RLS policies (requires authenticating as a user)
    console.log('\n📋 Note: RLS policy testing requires authentication flow, skipping in basic test');
    
    // Summary
    console.log('\n📊 Verification Summary:');
    console.log(`   Errors: ${errors}`);
    console.log(`   Warnings: ${warnings}`);
    
    if (errors === 0 && warnings === 0) {
      console.log('🎉 Database verification completed successfully!');
    } else if (errors === 0) {
      console.log('⚠️ Database verification completed with warnings.');
    } else {
      console.log('❌ Database verification failed with errors.');
    }
    
  } catch (err) {
    console.error('💥 Unexpected error during verification:', err);
    process.exit(1);
  }
}

// Run the verification
verifyDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 