// Helper utility to make the first user an admin
// This should be called once to bootstrap the admin system

import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Instructions:
// 1. Sign up for an account in the app
// 2. Copy your user email
// 3. Call this endpoint with your email to make yourself an admin
// 4. Use the admin panel to manage other admins

export async function makeFirstAdmin(email: string) {
  try {
    // Get user by email
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.log('Error listing users:', error)
      return { error: 'Failed to list users' }
    }
    
    const user = users.find(u => u.email === email)
    
    if (!user) {
      return { error: 'User not found with that email' }
    }
    
    // Get or create user profile
    let profile = await kv.get(`user:${user.id}`)
    
    if (!profile) {
      profile = {
        email: user.email,
        name: user.user_metadata?.name || email,
        favorites: [],
        createdAt: new Date().toISOString()
      }
    }
    
    // Make admin
    profile.isAdmin = true
    await kv.set(`user:${user.id}`, profile)
    
    return {
      success: true,
      message: `User ${email} is now an admin`,
      userId: user.id
    }
  } catch (error) {
    console.log('Error making admin:', error)
    return { error: String(error) }
  }
}
