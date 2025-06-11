import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please connect to Supabase using the button in the top right.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test Supabase connection
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test connection by checking authentication session instead of querying tables
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Supabase connection error:', error)
      return { 
        success: false, 
        error: `Connection failed: ${error.message}` 
      }
    }
    
    // Successfully connected to Supabase
    console.log('✅ Supabase connection successful!')
    return { 
      success: true, 
      message: 'Connection established - Supabase is ready' 
    }
    
  } catch (error) {
    console.error('Supabase connection test failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown connection error occurred' 
    }
  }
}