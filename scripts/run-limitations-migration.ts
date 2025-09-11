#!/usr/bin/env tsx

/**
 * Migration script to add limitations column to plans table
 * Run this script to migrate existing data from features to limitations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting limitations column migration...');

    // Step 1: Add limitations column
    console.log('📝 Adding limitations column...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE plans 
        ADD COLUMN IF NOT EXISTS limitations JSONB DEFAULT '{}'::jsonb;
        
        COMMENT ON COLUMN plans.limitations IS 'Plan limitations and constraints stored as JSONB';
        
        CREATE INDEX IF NOT EXISTS idx_plans_limitations ON plans USING GIN (limitations);
      `
    });

    if (alterError) {
      console.error('❌ Error adding limitations column:', alterError);
      return;
    }

    console.log('✅ Limitations column added successfully');

    // Step 2: Migrate existing data
    console.log('🔄 Migrating existing limit data...');
    
    // Get all plans with features
    const { data: plans, error: fetchError } = await supabase
      .from('plans')
      .select('id, features')
      .not('features', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching plans:', fetchError);
      return;
    }

    console.log(`📊 Found ${plans?.length || 0} plans to migrate`);

    // Process each plan
    for (const plan of plans || []) {
      if (!plan.features || typeof plan.features !== 'object') continue;

      const features: Record<string, any> = {};
      const limitations: Record<string, any> = {};

      // Separate features and limitations based on key patterns
      const limitKeywords = [
        'max_', 'min_', 'limit', 'quota', 'threshold', 'capacity', 
        'rate', 'per_', 'allowed', 'restricted', 'constraint',
        'queue_priority', 'wait_time', 'api_calls', 'storage',
        'concurrent', 'timeout', 'retry', 'backoff'
      ];

      for (const [key, value] of Object.entries(plan.features)) {
        const isLimit = limitKeywords.some(keyword => 
          key.toLowerCase().includes(keyword)
        );

        if (isLimit) {
          limitations[key] = value;
        } else {
          features[key] = value;
        }
      }

      // Update the plan with separated data
      const { error: updateError } = await supabase
        .from('plans')
        .update({
          features,
          limitations
        })
        .eq('id', plan.id);

      if (updateError) {
        console.error(`❌ Error updating plan ${plan.id}:`, updateError);
      } else {
        console.log(`✅ Migrated plan ${plan.id}: ${Object.keys(features).length} features, ${Object.keys(limitations).length} limitations`);
      }
    }

    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify the data in your database');
    console.log('2. Test the updated UI');
    console.log('3. Remove this migration script if everything works correctly');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
