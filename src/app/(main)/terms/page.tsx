export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">利用規約</h1>
        <p className="text-xs text-gray-400 mb-10">最終更新日：2026年6月4日</p>

        <div className="space-y-10 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">第1条（サービス概要）</h2>
            <p>
              Codact（以下「本サービス」）は、山崎蓮（以下「運営者」）が提供するプログラミング学習サービスです。
              ユーザーは本サービスを通じて、実装問題への取り組みおよびAIによるコードレビューを受けることができます。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">第2条（利用登録）</h2>
            <p>
              本サービスへの登録は、本規約に同意のうえ、運営者の定める方法で申請することで完了します。
              運営者は、申請者が以下に該当すると判断した場合、登録を拒否することがあります。
            </p>
            <ul className="mt-3 list-disc list-inside space-y-1.5 text-gray-600">
              <li>虚偽の情報を提供した場合</li>
              <li>過去に本規約違反によりアカウントを停止された場合</li>
              <li>その他、運営者が不適切と判断した場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">第3条（禁止事項）</h2>
            <p>ユーザーは以下の行為を行ってはなりません。</p>
            <ul className="mt-3 list-disc list-inside space-y-1.5 text-gray-600">
              <li>法令または公序良俗に違反する行為</li>
              <li>本サービスのシステムに過度な負荷をかける行為</li>
              <li>本サービスのコンテンツを無断で複製・転載・販売する行為</li>
              <li>他のユーザーや第三者を誹謗中傷する行為</li>
              <li>不正アクセスや本サービスの運営を妨害する行為</li>
              <li>その他、運営者が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">第4条（免責事項）</h2>
            <p>
              運営者は、本サービスの内容の正確性・完全性について保証しません。
              本サービスの利用によって生じた損害について、運営者は一切の責任を負いません。
              また、本サービスはシステムメンテナンスやサービスの都合により、予告なく停止・変更・終了することがあります。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">第5条（退会）</h2>
            <p>
              ユーザーはいつでも本サービスを退会できます。
              退会後は、アカウントおよび学習データが削除されます。
              有料プランを契約中の場合は、退会前にStripeのマイページよりサブスクリプションをキャンセルしてください。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">第6条（準拠法・管轄裁判所）</h2>
            <p>
              本規約の解釈にあたっては日本法を準拠法とします。
              本サービスに関して紛争が生じた場合は、運営者の所在地を管轄する裁判所を専属的合意管轄裁判所とします。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
