@AGENTS.md

# Codact 実装仕様書（Claude Code用）

## プロジェクト概要

Codact（コーダクト）- AIレビュー付きプログラミング学習サービス。
本番URL: https://codact-three.vercel.app

---

## 技術スタック

| 役割 | 技術 | 備考 |
|---|---|---|
| フロントエンド・バックエンド | Next.js 16（App Router） | proxy.tsでセッション管理 |
| データベース・認証 | Supabase | PostgreSQL・認証一体 |
| コードエディタ | Monaco Editor（@monaco-editor/react） | dynamic importでSSR無効化 |
| コード実行 | Judge0 API（ce.judge0.com） | Piston APIが有料化のため移行済み |
| AIレビュー | Claude API（claude-haiku-4-5） | @anthropic-ai/sdk使用 |
| 決済 | Stripe | サブスクリプション・14日間無料トライアル |
| デプロイ | Vercel | mainブランチへのpushで自動デプロイ |

---

## 重要な注意事項

- Next.js 16ではmiddleware.tsではなくproxy.tsを使用する
- Next.js 16ではparamsはPromiseのためawaitが必要（例：`const { id } = await params`）
- Monaco EditorはClient Componentでdynamic importでSSR無効化して読み込む
- SupabaseのRow Level Security（RLS）を必ず有効にする
- APIキーはサーバーサイドのみで使用し、クライアントに露出しない
- WebhookエンドポイントはRLS・認証チェックをバイパスする必要がある
- /auth/callbackはpublicRoutesに含める必要がある
- 管理者ページはcreateAdminClient()（service_role key）でRLSをバイパスする
- Server ComponentにonClick等のイベントハンドラは使えない
- フォームの入力欄にtext-gray-900を付けないとダークモードで文字が見えなくなる

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
```

---

## パブリックルート（認証不要）

`proxy.ts`で以下のルートは認証チェックをスキップ:

`/login` · `/register` · `/welcome` · `/auth/callback` · `/api/stripe/webhook`

---

## ディレクトリ構成

```
src/
├── app/
│   ├── (auth)/login・register・logout
│   ├── (main)/dashboard・courses・lessons・pricing・settings・terms・privacy・legal
│   ├── (admin)/admin（コース・Level・Lesson管理）
│   ├── api/courses・levels・lessons・submissions・ai-reviews・progress・users・stripe
│   └── layout.tsx
├── components/editor/CodeEditor.tsx・layout/Navbar.tsx・layout/Footer.tsx
├── lib/supabase/client・server・admin・anthropic.ts・piston.ts・levelSummaries.ts
└── proxy.ts
```

---

## DB設計（主要テーブル）

| テーブル | カラム |
|---|---|
| users | id・email・name・plan(free/paid)・role(user/admin)・ai_review_count・ai_review_reset_at・stripe_customer_id・has_seen_welcome |
| courses | id・title・language・description・order |
| levels | id・course_id・title・order |
| lessons | id・level_id・title・content・initial_code・hint・order |
| submissions | id・user_id・lesson_id・code・status(passed/failed)・test_result |
| ai_reviews | id・user_id・submission_id・review |
| progress | id・user_id・lesson_id・status(not_started/in_progress/completed)・completed_at |
| test_cases | id・lesson_id・input・expected・order |

---

## 管理者ページ

| URL | 内容 |
|---|---|
| /admin | コース一覧・追加・編集・削除 |
| /admin/courses/[courseId] | Level一覧・追加・編集・削除・順番変更 |
| /admin/courses/[courseId]/levels/[levelId] | Lesson一覧・追加・編集・削除・順番変更・テストケース管理 |

- 管理者判定: usersテーブルの`role = 'admin'`
- データ操作: Server Actions + `createAdminClient()`（RLSバイパス）
- 編集フォームはClient Componentでインライン表示・Server Actionで保存

---

## Judge0 API

エンドポイント: `https://ce.judge0.com`

- `language_id`: 71（Python 3）
- `source_code` · `stdin`: base64エンコード
- レスポンスの`stdout` · `stderr`: base64デコード
- ポーリング間隔: 500ms・タイムアウト: 10秒

---

## プラン別制限

| プラン | AIレビュー回数/月 |
|---|---|
| free | 3回 |
| paid | 30回 |

月次リセット: `ai_review_reset_at`から1ヶ月経過で`ai_review_count`を0にリセット。

---

## Stripe

- 月額800円・14日間無料トライアル
- `checkout.session.completed`: planをpaidに更新・stripe_customer_idを保存
- `customer.subscription.deleted`: planをfreeに戻す
- WebhookはcreateAdminClient()を使用

---

## AIレビュー プロンプト

### 不合格時

```
あなたはプログラミング学習サービスのメンターです。
プログラミング初心者に対して、コードレビューを行ってください。

# ルール
- 答えやフルコードは絶対に出力しない
- 初心者にわかりやすい言葉で説明する
- 丁寧だけど堅すぎない口調にする
- ビックリマークは積極的に使う
- 絵文字は使わない
- ヒントは次の一手がわかる程度にとどめる
- 出力は5〜10行程度にする

# 問題文
{problem}

# テスト結果
{test_result}

# 提出コード
{code}

# 出力形式
【良い点】
（良い点を1〜2点）

【修正ポイント】
（修正が必要な箇所とその理由）

【ヒント】
（答えは出さず、次の一手となるヒントのみ）
```

### 合格時

```
あなたはプログラミング学習サービスのメンターです。
テストに合格したコードに対して、実務目線でのレビューを行ってください。

# ルール
- 初心者にわかりやすい言葉で説明する
- 実務でどう使われるかの観点を含める
- 改善提案は押しつけにならないよう提案ベースにする
- 丁寧だけど堅すぎない口調にする
- ビックリマークは積極的に使う
- 絵文字は使わない
- 出力は3〜7行程度にする

# 問題文
{problem}

# 提出コード
{code}

# 出力形式
【良い点】
（良い点を1〜2点）

【実務的な改善提案】
（実務観点での改善ポイントと理由）
```
