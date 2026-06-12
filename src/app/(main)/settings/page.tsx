import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/(auth)/logout/actions'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'

const PLAN_LABELS: Record<string, string> = {
  free: '無料プラン',
  paid: '有料プラン',
  vip: 'VIPプラン',
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: userData } = user
    ? await supabase
        .from('users')
        .select('name, email, plan, role')
        .eq('id', user.id)
        .single()
    : { data: null }

  const displayName = userData?.name ?? user?.user_metadata?.full_name ?? '—'
  const email = userData?.email ?? user?.email ?? '—'
  const plan = userData?.plan ?? 'free'
  const role = userData?.role ?? 'user'
  const displayPlan = role === 'vip' ? 'vip' : plan

  return (
    <div className="min-h-screen bg-gray-50">
      <Container size="xs" className="py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">設定</h1>

        {/* プロフィールセクション */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">プロフィール</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">表示名</p>
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">メールアドレス</p>
              <p className="text-sm font-medium text-gray-900">{email}</p>
            </div>
          </div>
        </section>

        {/* プランセクション */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">プラン</h2>
          </div>
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{PLAN_LABELS[displayPlan] ?? displayPlan}</p>
              {displayPlan === 'free' && (
                <p className="text-xs text-gray-400 mt-0.5">AIレビュー 月10回まで</p>
              )}
              {(displayPlan === 'paid' || displayPlan === 'vip') && (
                <p className="text-xs text-gray-400 mt-0.5">AIレビュー 月30回まで</p>
              )}
            </div>
            {displayPlan === 'free' && (
              <Button href="/pricing" variant="secondary" size="sm">アップグレード</Button>
            )}
          </div>
        </section>

        {/* ログアウトセクション */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">アカウント</h2>
          </div>
          <div className="px-6 py-5">
            <form action={logout}>
              <Button type="submit" variant="danger" size="md">ログアウト</Button>
            </form>
          </div>
        </section>
      </Container>
    </div>
  )
}
