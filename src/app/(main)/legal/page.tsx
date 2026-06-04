export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">特定商取引法に基づく表記</h1>
        <p className="text-xs text-gray-400 mb-10">最終更新日：2026年6月4日</p>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              <Row label="販売業者">山崎蓮</Row>
              <Row label="所在地">お問い合わせいただいた場合に遅滞なく開示します</Row>
              <Row label="メールアドレス">
                <a href="mailto:y26763041@gmail.com" className="text-blue-600 hover:underline">
                  y26763041@gmail.com
                </a>
              </Row>
              <Row label="販売価格">
                各プランページに表示する価格（税込）のとおり
                <br />
                <span className="text-gray-500">有料プラン：¥980 / 月</span>
              </Row>
              <Row label="販売価格以外の費用">
                インターネット接続に必要な通信料はお客様のご負担となります
              </Row>
              <Row label="支払方法">クレジットカード（Stripe経由）</Row>
              <Row label="支払時期">
                サブスクリプション開始日（無料トライアル終了後）より毎月自動引き落とし
              </Row>
              <Row label="サービス提供時期">
                決済完了後、即時ご利用いただけます
              </Row>
              <Row label="返品・キャンセル">
                サブスクリプションはいつでもキャンセル可能です。
                キャンセル後は次回更新日まで有料プランをご利用いただけます。
                既にお支払いいただいた料金の返金は原則として承っておりません。
              </Row>
              <Row label="動作環境">
                最新版のChrome・Firefox・Safari・Edgeを推奨します
              </Row>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="flex flex-col sm:flex-row">
      <th className="sm:w-44 shrink-0 px-5 py-4 text-left text-xs font-semibold text-gray-500 bg-gray-50 sm:border-r border-gray-100">
        {label}
      </th>
      <td className="px-5 py-4 text-gray-700 leading-relaxed">{children}</td>
    </tr>
  )
}
