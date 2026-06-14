'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import Stripe from 'stripe'
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

export async function deleteUser(userId: string): Promise<{ error?: string }> {
  await assertAdmin()

  const admin = createAdminClient()

  const { data: target, error: selectError } = await admin
    .from('users')
    .select('role, stripe_customer_id')
    .eq('id', userId)
    .single()

  if (selectError) {
    Sentry.captureException(selectError, { extra: { action: 'deleteUser', userId } })
    return { error: 'ユーザー情報の取得に失敗しました' }
  }

  if (target?.role === 'admin') {
    return { error: '管理者ユーザーは削除できません' }
  }

  if (target?.stripe_customer_id) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const [activeList, trialingList] = await Promise.all([
      stripe.subscriptions.list({ customer: target.stripe_customer_id, status: 'active' }),
      stripe.subscriptions.list({ customer: target.stripe_customer_id, status: 'trialing' }),
    ])
    if (activeList.data.length > 0 || trialingList.data.length > 0) {
      return { error: 'このユーザーは有効なサブスクリプションを持っています。先にStripeで解約してください。' }
    }
  }

  const { error: deletePublicError } = await admin
    .from('users')
    .delete()
    .eq('id', userId)

  if (deletePublicError) {
    Sentry.captureException(deletePublicError, { extra: { action: 'deleteUser', userId } })
    return { error: 'ユーザーデータの削除に失敗しました' }
  }

  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId)

  if (deleteAuthError) {
    Sentry.captureException(deleteAuthError, { extra: { action: 'deleteUser', userId } })
    return { error: '認証情報の削除に失敗しました' }
  }

  revalidatePath('/admin/users')
  return {}
}
