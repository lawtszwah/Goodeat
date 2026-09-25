import { createClient } from '@supabase/supabase-js'

// 这两个是前端公开值（publishable key），安全由数据库 RLS 保证
const SUPABASE_URL = 'https://ohsngekhoxlmhtumkups.supabase.co'
const SUPABASE_KEY = 'sb_publishable_ktoiylmHomMppJMhf-BfSQ_e0L3uh5O'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
})
