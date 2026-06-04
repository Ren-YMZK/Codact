export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">プライバシーポリシー</h1>
        <p className="text-xs text-gray-400 mb-10">最終更新日：2026年6月4日</p>

        <div className="space-y-10 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. 収集する個人情報</h2>
            <p>本サービスでは、以下の情報を収集します。</p>
            <ul className="mt-3 list-disc list-inside space-y-1.5 text-gray-600">
              <li>メールアドレス・表示名（アカウント登録時）</li>
              <li>学習進捗データ・提出コード</li>
              <li>決済情報（Stripeを通じて処理。カード情報は運営者が直接保持しません）</li>
              <li>アクセスログ・利用状況データ</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. 利用目的</h2>
            <p>収集した情報は以下の目的で利用します。</p>
            <ul className="mt-3 list-disc list-inside space-y-1.5 text-gray-600">
              <li>本サービスの提供・運営・改善</li>
              <li>AIによるコードレビュー機能の提供</li>
              <li>決済処理・プラン管理</li>
              <li>お問い合わせへの対応</li>
              <li>利用規約違反の調査・対応</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. 第三者提供</h2>
            <p>
              運営者は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
            </p>
            <ul className="mt-3 list-disc list-inside space-y-1.5 text-gray-600">
              <li>ユーザーの同意がある場合</li>
              <li>法令に基づく開示が必要な場合</li>
            </ul>
            <p className="mt-3">
              本サービスでは以下の外部サービスを利用しており、それぞれのプライバシーポリシーに従って情報が処理されます。
            </p>
            <ul className="mt-3 list-disc list-inside space-y-1.5 text-gray-600">
              <li>Supabase（認証・データベース）</li>
              <li>Stripe（決済処理）</li>
              <li>Anthropic（AIレビュー生成）</li>
              <li>Vercel（ホスティング）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. Cookieの使用</h2>
            <p>
              本サービスでは、ログイン状態の維持のためにCookieを使用します。
              ブラウザの設定によりCookieを無効にすることができますが、その場合一部機能が利用できなくなる可能性があります。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. 個人情報の管理</h2>
            <p>
              運営者は、収集した個人情報の漏洩・紛失・改ざんを防ぐため、適切なセキュリティ対策を講じます。
              不要となった個人情報は、適切な方法で削除します。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. お問い合わせ</h2>
            <p>個人情報の取り扱いに関するお問い合わせは以下までご連絡ください。</p>
            <div className="mt-3 px-4 py-3 bg-white border border-gray-200 rounded-lg space-y-1">
              <p><span className="text-gray-500">運営者：</span>山崎蓮</p>
              <p>
                <span className="text-gray-500">メール：</span>
                <a href="mailto:y26763041@gmail.com" className="text-blue-600 hover:underline">
                  y26763041@gmail.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
