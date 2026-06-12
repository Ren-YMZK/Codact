import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!userData?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'サブスクリプション情報が見つかりません' },
      { status: 400 },
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      return_url: `${baseUrl}/settings`,
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'ポータルセッションの作成に失敗しました' },
      { status: 500 },
    )
  }
}
