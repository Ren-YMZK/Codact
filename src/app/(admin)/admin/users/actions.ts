'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard')
  const { data: row } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (row?.role !== 'admin') redirect('/dashboard')
}

export async function setVip(formData: FormData) {
  await assertAdmin()
  const userId = formData.get('userId')
  if (!userId || typeof userId !== 'string') return
  const admin = createAdminClient()
  const { data: target, error: selectError } = await admin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  if (selectError) {
    Sentry.captureException(selectError, { extra: { action: 'setVip', userId } })
    return
  }
  if (target?.role === 'admin') return
  const { error: updateError } = await admin
    .from('users')
    .update({ role: 'vip' })
    .eq('id', userId)
  if (updateError) {
    Sentry.captureException(updateError, { extra: { action: 'setVip', userId } })
    return
  }
  revalidatePath('/admin/users')
}

export async function unsetVip(formData: FormData) {
  await assertAdmin()
  const userId = formData.get('userId')
  if (!userId || typeof userId !== 'string') return
  const admin = createAdminClient()
  const { data: target, error: selectError } = await admin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  if (selectError) {
    Sentry.captureException(selectError, { extra: { action: 'unsetVip', userId } })
    return
  }
  if (target?.role === 'admin') return
  const { error: updateError } = await admin
    .from('users')
    .update({ role: 'user' })
    .eq('id', userId)
  if (updateError) {
    Sentry.captureException(updateError, { extra: { action: 'unsetVip', userId } })
    return
  }
  revalidatePath('/admin/users')
}
