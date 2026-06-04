import { markWelcomeSeen } from './actions'

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: '実装問題に取り組む',
    description: '実務で使われる課題を手を動かしながら解いていきます。',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: '自動テストで即確認',
    description: 'コードを提出するとすぐにテストが走り、結果がわかります。',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'AIレビューで実務力を身につける',
    description: 'AIメンターがコードを読んで、改善のヒントを教えてくれます。',
  },
]

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg text-center">
        {/* アイコン */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
        </div>

        {/* メッセージ */}
        <h1 className="text-3xl font-bold text-gray-900">
          ようこそ、Codactへ!
        </h1>
        <p className="mt-3 text-gray-500">
          コードを書いて、テストして、AIに聞いて——実務力を身につけよう。
        </p>

        {/* 3つの特徴 */}
        <div className="mt-10 space-y-4 text-left">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                {feature.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{feature.title}</p>
                <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAボタン */}
        <form action={markWelcomeSeen} className="mt-8">
          <button
            type="submit"
            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            さっそく始める
          </button>
        </form>
      </div>
    </div>
  )
}
