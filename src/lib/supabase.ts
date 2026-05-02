import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!

// use this in frontend components
export const supabase = createClient(supabaseUrl, supabasePublishableKey)

// use this in API routes only — has full DB access
export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey)