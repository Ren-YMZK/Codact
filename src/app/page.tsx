import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ナビゲーションバー */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-blue-600 tracking-tight">
            Codact
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              ログイン
            </Link>
            <Button href="/register" variant="primary" size="sm">
              無料で始める
            </Button>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
            知識を、実装力に変えよう。
          </h1>
          <p className="mt-6 text-lg text-blue-100 leading-8 max-w-xl mx-auto">
            知識をインプットするだけでは、何も作れない。Codactは実装問題とAIレビューで、本当に使えるプログラミングスキルを鍛える学習サービスです。
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              href="/register"
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto text-blue-700 border-0 shadow-md"
            >
              無料で始める
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
            <Link
              href="/login"
              className="text-sm text-blue-200 hover:text-white transition-colors"
            >
              ログインはこちら
            </Link>
          </div>
        </div>
      </section>

      {/* 特徴紹介セクション */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            Codactの特徴
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* 特徴1 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                実装問題で手を動かす
              </h3>
              <p className="text-sm text-gray-600 leading-6">
                読むだけ・見るだけの学習を卒業。実際にコードを書いて、テストをパスすることで確かな実装力が身につきます。
              </p>
            </div>
            {/* 特徴2 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.636 6.364l.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                AIレビューで成長を加速
              </h3>
              <p className="text-sm text-gray-600 leading-6">
                提出したコードをAIがレビュー。合格後も実務目線でのフィードバックを受けることで、より良いコードへと磨かれます。
              </p>
            </div>
            {/* 特徴3 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                段階的なカリキュラム
              </h3>
              <p className="text-sm text-gray-600 leading-6">
                完全未経験から始められるLevel 0から、応用的な実装まで学べる上位Levelまで。社員管理システムやショッピングカートなど、実際のプロダクトを育てながら実装力を体系的に身につけます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* コース紹介セクション */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">学べるコース</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Pythonコース */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 mb-4">
                Python
              </span>
              <h3 className="text-base font-bold text-gray-900 mb-2">Pythonコース</h3>
              <p className="text-sm text-gray-600 leading-6">
                社員管理システムを育てながら、Pythonの基礎から実装力までを身につけます。全8Level・65Lesson。
              </p>
            </div>
            {/* JavaScriptコース */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600 mb-4">
                JavaScript
              </span>
              <h3 className="text-base font-bold text-gray-900 mb-2">JavaScriptコース</h3>
              <p className="text-sm text-gray-600 leading-6">
                ショッピングカートを作りながら、JavaScriptの基礎から実装力までを身につけます。全8Level・65Lesson。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* プラン比較セクション */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            プラン
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* 無料プラン */}
            <div className="rounded-2xl border border-gray-200 p-8">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                無料プラン
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">¥0</p>
              <p className="text-sm text-gray-400 mb-6">ずっと無料</p>
              <ul className="space-y-3 mb-8">
                {["全Level・全Lessonが学習可能", "AIレビュー 月10回"].map(
                  (item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <svg
                        className="w-4 h-4 text-green-500 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {item}
                    </li>
                  ),
                )}
              </ul>
              <Button href="/register" variant="secondary" size="md" className="w-full">
                無料で始める
              </Button>
            </div>
            {/* 有料プラン */}
            <div className="rounded-2xl border-2 border-blue-600 bg-blue-600 p-8 text-white relative">
              <span className="absolute top-4 right-4 bg-white text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full">
                人気
              </span>
              <p className="text-sm font-semibold text-blue-200 uppercase tracking-wide mb-2">
                有料プラン
              </p>
              <p className="text-3xl font-bold mb-1">
                ¥800
                <span className="text-lg font-normal text-blue-200">/月</span>
              </p>
              <p className="text-sm text-blue-200 mb-6">14日間無料トライアル</p>
              <ul className="space-y-3 mb-8">
                {[
                  "全Level・全Lessonが学習可能",
                  "AIレビュー 月30回",
                  "14日間無料トライアル",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-white"
                  >
                    <svg
                      className="w-4 h-4 text-blue-200 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Button href="/pricing" variant="secondary" size="md" className="w-full text-blue-700 border-0">
                14日間無料で試す
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            さっそく始めよう
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            無料プランでも全てのコースが学習できます。まずは試してみましょう。
          </p>
          <Button href="/register" variant="primary" size="lg" className="shadow-md">
            無料で始める
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-gray-100 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-bold text-blue-600">Codact</span>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link
              href="/terms"
              className="hover:text-gray-600 transition-colors"
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              className="hover:text-gray-600 transition-colors"
            >
              プライバシーポリシー
            </Link>
            <Link
              href="/legal"
              className="hover:text-gray-600 transition-colors"
            >
              特定商取引法
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
