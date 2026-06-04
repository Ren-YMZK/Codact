'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function markWelcomeSeen() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabase
      .from('users')
      .update({ has_seen_welcome: true })
      .eq('id', user.id)
  }

  redirect('/courses')
}
