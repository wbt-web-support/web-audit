import { createClient } from '@supabase/supabase-js'

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables!')
  console.error('Please set the following environment variables:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('You can set them by:')
  console.error('1. Creating a .env.local file in the project root')
  console.error('2. Or setting them in your terminal before running the script')
  console.error('')
  console.error('Example .env.local file:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=your-supabase-url-here')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here')
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function createTestUsers() {
  console.log('Starting to create 20 test users...')
  console.log('Using Supabase URL:', supabaseUrl)
  
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
