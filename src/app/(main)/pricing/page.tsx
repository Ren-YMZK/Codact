import { createClient } from '@/lib/supabase/server'
import PricingClient from './PricingClient'
import { Container } from '@/components/ui/Container'

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: userData } = user
    ? await supabase.from('users').select('plan').eq('id', user.id).single()
    : { data: null }

  const isPaid = userData?.plan === 'paid'

  return (
    <div className="min-h-screen bg-gray-50">
      <Container size="narrow" className="py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">料金プラン</h1>
          <p className="mt-3 text-sm text-gray-500">自分のペースでコードを書く力を身につけよう</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* 無料プラン */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-7 py-8 flex flex-col">
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">無料プラン</p>
              <p className="text-3xl font-bold text-gray-900">¥0</p>
              <p className="text-sm text-gray-400 mt-1">ずっと無料</p>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              <FeatureItem>全コースのLesson閲覧</FeatureItem>
              <FeatureItem>コード実行・テスト</FeatureItem>
              <FeatureItem muted>AIレビュー 月10回まで</FeatureItem>
            </ul>
            <div className="px-4 py-2.5 text-center text-sm font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-xl">
              現在のプラン
            </div>
          </div>

          {/* 有料プラン */}
          <div className="bg-white rounded-2xl border-2 border-blue-500 shadow-md px-7 py-8 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">おすすめ</span>
            </div>
            <div className="mb-6">
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">有料プラン</p>
              <p className="text-3xl font-bold text-gray-900">¥980<span className="text-base font-normal text-gray-400"> / 月</span></p>
              <p className="text-sm text-blue-500 mt-1 font-medium">14日間無料で試せる</p>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              <FeatureItem>全コースのLesson閲覧</FeatureItem>
              <FeatureItem>コード実行・テスト</FeatureItem>
              <FeatureItem highlight>AIレビュー 月30回まで</FeatureItem>
            </ul>
            {isPaid ? (
              <div className="px-4 py-2.5 text-center text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl">
                現在のプラン
              </div>
            ) : (
              <PricingClient />
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          無料トライアル期間中はいつでもキャンセルできます。クレジットカード情報はStripeで安全に管理されます。
        </p>
      </Container>
    </div>
  )
}

function FeatureItem({
  children,
  muted,
  highlight,
}: {
  children: React.ReactNode
  muted?: boolean
  highlight?: boolean
}) {
  return (
    <li className="flex items-start gap-2.5">
      <svg
        className={`w-4 h-4 mt-0.5 shrink-0 ${highlight ? 'text-blue-500' : muted ? 'text-gray-300' : 'text-green-500'}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-700'}`}>{children}</span>
    </li>
  )
}
