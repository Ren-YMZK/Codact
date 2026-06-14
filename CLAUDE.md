@AGENTS.md

# Codact 実装仕様書（Claude Code用）

## プロジェクト概要

Codact（コーダクト）- AIレビュー付きプログラミング学習サービス。
Python・JavaScript の2コース体制（計130 Lesson）。
本番URL: https://codact-three.vercel.app

---

## 技術スタック

| 役割 | 技術 | 備考 |
|---|---|---|
| フロントエンド・バックエンド | Next.js 16（App Router） | proxy.tsでセッション管理 |
| データベース・認証 | Supabase | PostgreSQL・認証一体 |
| コードエディタ | Monaco Editor（@monaco-editor/react） | dynamic importでSSR無効化 |
| コード実行 | Judge0 API | JUDGE0_BASE_URL環境変数で切り替え可 |
| AIレビュー | Claude API（claude-haiku-4-5） | @anthropic-ai/sdk使用 |
| 決済 | Stripe | サブスクリプション・14日間無料トライアル |
| エラー監視 | Sentry | instrumentation.ts + captureException |
| デプロイ | Vercel | mainブランチへのpushで自動デプロイ |

---

## 重要な注意事項

- Next.js 16ではmiddleware.tsではなく**proxy.ts**を使用する
- Next.js 16ではparamsはPromiseのためawaitが必要（例：`const { id } = await params`）
- Monaco EditorはClient Componentでdynamic importでSSR無効化して読み込む
- SupabaseのRow Level Security（RLS）を必ず有効にする
- APIキーはサーバーサイドのみで使用し、クライアントに露出しない
- WebhookエンドポイントはRLS・認証チェックをバイパスする必要がある
- /auth/callbackはpublicRoutesに含める必要がある
- 管理者ページはcreateAdminClient()（service_role key）でRLSをバイパスする
- Server ComponentにonClick等のイベントハンドラは使えない
- フォームの入力欄にtext-gray-900を付けないとダークモードで文字が見えなくなる
- SQLのorderカラムは予約語のため`"order"`とダブルクォート必須
- ボタンは必ずButton.tsxを使用する（直書きボタン禁止）
- エラーは`Sentry.captureException(error)`で記録する
- Lesson画面はPC前提・モバイル対応なし
- テストコードは現フェーズでは書かない

---

## 環境変数

`.env.local`に以下を設定する。

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
JUDGE0_BASE_URL=          # 省略時は https://ce.judge0.com
NEXT_PUBLIC_APP_URL=      # Google OAuth リダイレクト用
```

---

## パブリックルート（認証不要）

`proxy.ts`で以下のルートは認証チェックをスキップ:

`/` · `/login` · `/register` · `/welcome` · `/auth/callback` · `/api/stripe/webhook`

`/welcome`はログイン済みかつ`has_seen_welcome=true`なら`/dashboard`へリダイレクト。

---

## ディレクトリ構成

```
src/
├── app/
│   ├── (auth)/login・register・logout
│   ├── (main)/dashboard・courses・lessons・pricing・settings・terms・privacy・legal・welcome
│   ├── (admin)/admin/（コース・Level・Lesson管理）
│   │   ├── page.tsx（コース一覧）
│   │   ├── stats/（統計画面）
│   │   └── courses/[courseId]/levels/[levelId]/
│   ├── api/courses・levels・lessons・submissions・ai-reviews・progress・users・stripe
│   └── layout.tsx
├── components/
│   ├── editor/CodeEditor.tsx
│   ├── layout/Navbar.tsx・Footer.tsx
│   └── ui/Button.tsx・Container.tsx・StatusIcon.tsx
├── lib/
│   ├── supabase/client.ts・server.ts・admin.ts・auth.ts
│   ├── anthropic.ts
│   ├── piston.ts         （Judge0ラッパー・言語管理）
│   ├── aiReview.ts       （プラン制限・月次リセットロジック）
│   └── supabaseHelpers.ts（PostgRESTのobject/array両対応型ガード）
├── instrumentation.ts    （Sentry初期化）
└── proxy.ts
```

---

## DB設計（主要テーブル）

| テーブル | カラム |
|---|---|
| users | id・email・name・plan(free/paid)・role(user/vip/admin)・ai_review_count・ai_review_reset_at・stripe_customer_id・has_seen_welcome・created_at |
| courses | id・title・language・description・order |
| levels | id・course_id・title・order・concepts（text[]）・built・next_preview |
| lessons | id・level_id・title・content・initial_code・hint・order |
| submissions | id・user_id・lesson_id・code・status(passed/failed)・test_result・created_at |
| ai_reviews | id・user_id・submission_id・review・created_at |
| progress | id・user_id・lesson_id・status(not_started/in_progress/completed)・completed_at |
| test_cases | id・lesson_id・input・expected・order |

`users.role`：CHECK制約あり（'user'/'vip'/'admin'のみ許可）。新しいroleを追加する場合は制約の作り直しが必要。
`levels.concepts`：そのLevelで学ぶ概念一覧（AIレビューの制約生成に使用）
`levels.built`・`levels.next_preview`：Level完了画面のサマリー表示に使用

---

## DB RPC関数（Supabase）

すべて`SECURITY DEFINER`で定義。アプリ側は`createAdminClient()`（service_role）経由で呼び出す。

| 関数 | 用途 | 備考 |
|---|---|---|
| `save_ai_review_and_increment(p_user_id, p_submission_id, p_review)` | ai_reviewsへの挿入とai_review_countの加算をアトミックに実行 | 通常ユーザーのみ使用（adminはスキップ） |
| `get_course_progress_summary(p_user_id)` | ダッシュボードのコース別集計（total_lessons・completed_lessons） | ユーザーRLS内 |
| `get_admin_stats_summary()` | 統計サマリー（ユーザー数・提出数等） | **admin除外済み** |
| `get_admin_lesson_stats()` | Lesson別統計（course_started_users含む） | **admin除外済み** |
| `get_admin_user_stats()` | ユーザー別統計（LIMIT 100・登録日降順） | **admin除外済み** |

**統計RPC共通：** `role='admin'`のユーザーはすべての集計から除外。
`get_admin_lesson_stats()`は`"order"`カラムのクォートに注意。
戻り値カラム構成は変更しない（アプリ側TypeScript型と対応）。

---

## UIコンポーネント

### Button.tsx（`@/components/ui/Button`）
- `variant`: `primary`（青）/ `secondary`（白枠）/ `danger`（赤枠）/ `success`（緑）
- `size`: `sm` / `md`（デフォルト）/ `lg`
- `href` propを渡すと`<Link>`として動作、渡さないと`<button>`

### Container.tsx（`@/components/ui/Container`）
- `size`: `xs`（max-w-xl）/ `narrow`（max-w-3xl・デフォルト）/ `wide`（max-w-5xl）

### StatusIcon.tsx（`@/components/ui/StatusIcon`）
- 進捗状態アイコン表示用

---

## 主要ライブラリ

### piston.ts（Judge0ラッパー）
```ts
export const LANGUAGE_IDS: Record<string, number> = { Python: 71, JavaScript: 63 }
export async function executeCode(language: string, code: string, stdin?: string): Promise<PistonResult>
// PistonResult: { stdout: string; stderr: string }
```
- `JUDGE0_BASE_URL`環境変数で実行先を切り替え（デフォルト: `https://ce.judge0.com`）
- base64エンコード/デコード・500msポーリング・10秒タイムアウト

### supabaseHelpers.ts
```ts
export function extractLanguage(courses: unknown): string          // PostgRESTのJOIN結果から言語取得
export function extractLesson(val: unknown): { id, title } | null // object/array両対応
export function extractNextLesson(val: unknown): NextLessonInfo | null
// NextLessonInfo: { id, title, levelTitle, levelOrder, courseTitle }
// toObj(): 内部ヘルパー（非export）
```
PostgRESTのリレーションがobjectで返るかarrayで返るか実行時に不定なケースに対応。

### aiReview.ts
```ts
export const FREE_LIMIT = 10
export const PAID_LIMIT = 30
export function getPlanLimit(plan: string, role?: string | null): number
// role='vip' の場合は plan に関わらず PAID_LIMIT を返す
export function isMonthlyResetNeeded(resetAtIso: string): boolean
export async function applyMonthlyResetIfNeeded(supabase, userId, currentCount, resetAtIso): Promise<number>
```

---

## 管理者ページ

| URL | 内容 |
|---|---|
| /admin | コース一覧・追加・編集・削除 |
| /admin/stats | 統計ダッシュボード（サマリー・Lesson別進捗・ユーザー別一覧） |
| /admin/users | ユーザー管理（VIPロール付与・解除・アカウント削除） |
| /admin/courses/[courseId] | Level一覧・追加・編集・削除・順番変更 |
| /admin/courses/[courseId]/levels/[levelId] | Lesson一覧・追加・編集・削除・順番変更・テストケース管理 |

- 管理者判定: usersテーブルの`role = 'admin'`
- データ操作: Server Actions + `createAdminClient()`（RLSバイパス）
- コース追加・編集のlanguageはセレクトボックス（`LANGUAGE_IDS`のキー由来）
- 編集フォームはClient Componentでインライン表示・Server Actionで保存

### /admin/users の実装詳細
- 各ユーザー行の右端に三点メニュー（⋮）、クリックでドロップダウン開閉（メニュー外クリックで閉じる）
- メニュー項目：role='user'→「VIPにする」「ユーザーを削除」、role='vip'→「VIP解除」「ユーザーを削除」、role='admin'→メニュー非表示
- **ユーザー削除フロー**：メールアドレス入力確認モーダル → `deleteUser` Server Action
  - ガード1：対象が`role='admin'`なら中断
  - ガード2：`stripe_customer_id`がある場合、`active`・`trialing`のサブスクを確認し、有効なら中断してエラーメッセージを返す
  - 削除：`createAdminClient()`で`public.users`の行を削除（CASCADEでsubmissions/progress/ai_reviewsも連鎖削除）→ `auth.admin.deleteUser(userId)`でauth.usersを削除
  - `deleteUser`は`Promise<{ error?: string }>`を返し、クライアント側でエラー表示に使用
- **DB CASCADE設定**：submissions・progress・ai_reviewsのuser_id外部キーはON DELETE CASCADE済み。public.usersの行削除で関連データが自動連鎖削除される
- **注意**：public.usersとauth.usersは外部キーで繋がっていないため、両方を個別に削除する必要がある

### /admin/stats の実装詳細
- `stats/page.tsx`（Server Component）でRPC呼び出し → `StatsTree.tsx`（Client Component）に渡す
- StatsTreeはコース→Level→Lessonの3階層アコーディオン
- 開閉状態をlocalStorageキー`codact_admin_stats_expanded`に保存（JSON: `{courses: string[], levels: string[]}`）
- 平均提出回数≥3.0 または 完了0かつ提出≥3 のLesson行を`bg-red-50`でハイライト
- 完了率 = completed_count / course_started_users（Level・コース行は配下Lessonの平均）

---

## Judge0 API

- エンドポイント: `JUDGE0_BASE_URL`環境変数（デフォルト `https://ce.judge0.com`）
- `language_id`: Python=71 / JavaScript=63
- `source_code`・`stdin`: base64エンコード
- レスポンスの`stdout`・`stderr`: base64デコード
- ポーリング間隔: 500ms・タイムアウト: 10秒
- status.id が 1（In Queue）・2（Processing）の間はポーリング継続

---

## プラン別制限

| プラン | AIレビュー回数/月 |
|---|---|
| free | 10回 |
| paid | 30回 |
| vip | 30回（role='vip'で判定・課金なし・統計には通常ユーザーとして含まれる） |
| admin | 無制限（チェック・カウント加算スキップ） |

月次リセット: `ai_review_reset_at`から30日経過で`ai_review_count`を0にリセット（`applyMonthlyResetIfNeeded`）。

---

## Stripe

- 月額800円・14日間無料トライアル（`subscription_data: { trial_period_days: 14 }` をコード側で指定）
- 再登録によるトライアル繰り返しは現状許容する方針
- Webhookイベント：`checkout.session.completed`（planをpaidに更新・stripe_customer_idを保存）と`customer.subscription.deleted`（planをfreeに戻す）の2つのみ処理
- WebhookはcreateAdminClient()を使用
- **本番環境の運用方針**：本番APIキー・STRIPE_PRICE_ID・STRIPE_WEBHOOK_SECRETはVercel環境変数で管理。`.env.local`はテスト環境キーのままにしておく
- **Customer Portal**：`/api/stripe/create-portal-session`（POST）でセッション作成→リダイレクト。`plan='paid'`のユーザーのみ設定ページに「サブスクリプションを管理」ボタンを表示（vip対象外）。利用にはStripeダッシュボード（Billing → Customer portal）でのポータル設定の保存が必要。キャンセルは期間終了時まで有効のまま（即時解約は無効）に設定すること

---

## AIレビュー

### フロー（`api/ai-reviews/route.ts`）
1. ユーザー情報・提出情報を並列取得
2. adminでなければ月次リセット確認 → 残数チェック（超過なら403）
3. Lesson→Level→Courseと辿り言語を取得（`extractLanguage`使用）
4. 同コース・現Level以下の`concepts`を結合して学習済み概念を生成
5. Claude API呼び出し（`claude-haiku-4-5`・max_tokens: 1024）
6. adminは直接INSERT、通常ユーザーは`save_ai_review_and_increment` RPC

### プロンプトの特徴（両プロンプト共通）
- `{language}`・`{learned_concepts}`・`{problem}`・`{code}` を埋め込み
- **プロンプトインジェクション対策**: コードを`<user_code>`タグ、テスト結果を`<test_result>`タグで囲み、タグ内の指示を無視するよう明示
- `{learned_concepts}`の範囲内でのみアドバイスする制約を指示
- プロンプト本文は`api/ai-reviews/route.ts`の`PROMPT_FAILED`・`PROMPT_PASSED`定数を参照

### 不合格時（PROMPT_FAILED）の出力形式
```
【良い点】【修正ポイント】【ヒント】
```
答え・フルコード禁止、5〜10行程度、次の一手レベルのヒントのみ。

### 合格時（PROMPT_PASSED）の出力形式
```
【良い点】【実務的な改善提案】
```
実務観点での改善提案（提案ベース）、3〜7行程度。

---

## Lesson画面の主要UX（`LessonClient.tsx`）

- リセット確認はモーダルではなく**インライン緑バナー + `window.confirm`**
- AIレビュー残り1回時に**amber警告**を表示
- テスト失敗時は`buildDiffRows(expected, actual)`で行ごとの差分をハイライト表示
- 提出済みコードがある場合はinitialCodeとして復元（`passedCode`）
- AIレビュー残数は`/api/users/me/ai-review-count`から取得（`{ remaining, limit, unlimited }`）
