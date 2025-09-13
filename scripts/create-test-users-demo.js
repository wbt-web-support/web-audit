// Demo script to create test users
// This is a JavaScript version that can be run with inline environment variables

const { createClient } = require('@supabase/supabase-js')

// You can set these directly here for testing (replace with your actual values)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE'

if (supabaseUrl === 'YOUR_SUPABASE_URL_HERE' || serviceRoleKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.log('❌ Please update the script with your actual Supabase credentials')
  console.log('Edit scripts/create-test-users-demo.js and replace:')
  console.log('  - YOUR_SUPABASE_URL_HERE with your actual Supabase URL')
  console.log('  - YOUR_SERVICE_ROLE_KEY_HERE with your actual service role key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function createTestUsers() {
  console.log('🚀 Starting to create 20 test users...')
  console.log('📍 Using Supabase URL:', supabaseUrl)
  
  let successCount = 0
  let errorCount = 0

  for (let i = 1; i <= 20; i++) {
    const email = `test${i}@gmail.com`
    const password = `test${i}`
    
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      
      if (error) {
        console.error(`❌ Error creating ${email}:`, error.message)
        errorCount++
      } else {
        console.log(`✅ Created user: ${email} (ID: ${data.user?.id})`)
        successCount++
      }
    } catch (err) {
      console.error(`❌ Unexpected error creating ${email}:`, err)
      errorCount++
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log('\n📊 Summary:')
  console.log(`✅ Successfully created: ${successCount} users`)
  console.log(`❌ Failed to create: ${errorCount} users`)
  console.log(`📧 Test users created with emails: test1@gmail.com to test20@gmail.com`)
  console.log(`🔑 All passwords follow pattern: test1, test2, ..., test20`)
}

// Run the function
createTestUsers()
  .then(() => {
    console.log('\n🎉 Test user creation completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
