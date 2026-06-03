@AGENTS.md

# Codact 実装仕様書（Claude Code用）

## プロジェクト概要

Codact（コーダクト）- AIレビュー付きプログラミング学習サービス。
ユーザーが実装問題に取り組み、自動テストとAIレビューを受けながら実装力を身につけるWebアプリ。

---

## 技術スタック

| 役割                         | 技術                           | 備考                                  |
| ---------------------------- | ------------------------------ | ------------------------------------- |
| フロントエンド・バックエンド | Next.js（App Router）          | API RoutesをバックエンドAPIとして使用 |
| データベース・認証           | Supabase                       | PostgreSQL・認証・ストレージ一体      |
| コードエディタ               | Monaco Editor                  | ブラウザ上のコードエディタ            |
| コード実行                   | Piston API                     | サンドボックス環境でのコード実行      |
| AIレビュー                   | Claude API（claude-haiku-4-5） | コードレビュー生成                    |
| 決済                         | Stripe                         | サブスクリプション課金                |
| エラー監視                   | Sentry                         | フロントエンド・APIエラー検知         |
| デプロイ                     | Vercel                         | Next.jsのホスティング                 |

---

## 環境変数

.env.localに以下を設定する。

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
SENTRY_DSN=
```

---

## ディレクトリ構成

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (main)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── courses/
│   │   │   └── page.tsx
│   │   ├── courses/[courseId]/
│   │   │   └── page.tsx
│   │   ├── courses/[courseId]/levels/[levelId]/
│   │   │   └── page.tsx
│   │   └── lessons/[lessonId]/
│   │       └── page.tsx
│   ├── api/
│   │   ├── courses/
│   │   │   └── route.ts
│   │   ├── courses/[id]/levels/
│   │   │   └── route.ts
│   │   ├── levels/[id]/lessons/
│   │   │   └── route.ts
│   │   ├── lessons/[id]/
│   │   │   └── route.ts
│   │   ├── submissions/
│   │   │   └── route.ts
│   │   ├── submissions/[id]/
│   │   │   └── route.ts
│   │   ├── lessons/[id]/submissions/
│   │   │   └── route.ts
│   │   ├── ai-reviews/
│   │   │   └── route.ts
│   │   ├── ai-reviews/[submissionId]/
│   │   │   └── route.ts
│   │   ├── progress/
│   │   │   └── route.ts
│   │   ├── progress/[lessonId]/
│   │   │   └── route.ts
│   │   ├── users/me/
│   │   │   └── route.ts
│   │   └── users/me/ai-review-count/
│   │       └── route.ts
│   └── layout.tsx
├── components/
│   ├── editor/
│   │   └── CodeEditor.tsx
│   ├── lesson/
│   │   ├── LessonContent.tsx
│   │   ├── TestResult.tsx
│   │   └── AIReview.tsx
│   └── ui/
│       └── ProgressBar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── anthropic.ts
│   └── piston.ts
└── types/
    └── index.ts
```

---

## DB設計

Supabase（PostgreSQL）を使用。

### usersテーブル

```sql
create table users (
  id uuid references auth.users primary key,
  email text not null,
  name text,
  plan text not null default 'free' check (plan in ('free', 'paid')),
  ai_review_count integer not null default 0,
  ai_review_reset_at timestamp with time zone not null default now(),
  stripe_customer_id text,
  created_at timestamp with time zone not null default now()
);
```

### coursesテーブル

```sql
create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  language text not null,
  description text,
  "order" integer not null default 0,
  created_at timestamp with time zone not null default now()
);
```

### levelsテーブル

```sql
create table levels (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses not null,
  title text not null,
  "order" integer not null default 0,
  created_at timestamp with time zone not null default now()
);
```

### lessonsテーブル

```sql
create table lessons (
  id uuid primary key default gen_random_uuid(),
  level_id uuid references levels not null,
  title text not null,
  content text not null,
  initial_code text not null default '',
  hint text,
  "order" integer not null default 0,
  created_at timestamp with time zone not null default now()
);
```

### submissionsテーブル

```sql
create table submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users not null,
  lesson_id uuid references lessons not null,
  code text not null,
  status text not null check (status in ('passed', 'failed')),
  test_result jsonb,
  created_at timestamp with time zone not null default now()
);
```

### ai_reviewsテーブル

```sql
create table ai_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users not null,
  submission_id uuid references submissions not null unique,
  review text not null,
  created_at timestamp with time zone not null default now()
);
```

### progressテーブル

```sql
create table progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users not null,
  lesson_id uuid references lessons not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  completed_at timestamp with time zone,
  unique (user_id, lesson_id)
);
```

### test_casesテーブル（将来用・今は使わない）

```sql
create table test_cases (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons not null,
  input text not null,
  expected text not null,
  "order" integer not null default 0,
  created_at timestamp with time zone not null default now()
);
```

---

## API設計

Next.jsのApp RouterのRoute Handlersで実装する。
全APIは認証済みユーザーのみアクセス可能（Supabaseのセッションで認証チェック）。

### 学習コンテンツ系

| メソッド | エンドポイント          | 内容                       |
| -------- | ----------------------- | -------------------------- |
| GET      | /api/courses            | コース一覧取得             |
| GET      | /api/courses/:id/levels | Level一覧取得              |
| GET      | /api/levels/:id/lessons | Lesson一覧取得             |
| GET      | /api/lessons/:id        | Lesson詳細取得（hint含む） |

### 実行・提出系

| メソッド | エンドポイント               | 内容                                         |
| -------- | ---------------------------- | -------------------------------------------- |
| POST     | /api/submissions             | コード提出・Piston APIでテスト実行・結果保存 |
| GET      | /api/submissions/:id         | 提出結果取得                                 |
| GET      | /api/lessons/:id/submissions | Lesson別提出履歴取得                         |

POSTのリクエストボディ：

```json
{
  "lesson_id": "uuid",
  "code": "ユーザーのコード"
}
```

### AIレビュー系

| メソッド | エンドポイント                | 内容                                             |
| -------- | ----------------------------- | ------------------------------------------------ |
| POST     | /api/ai-reviews               | AIレビュー依頼・回数チェック・Claude API呼び出し |
| GET      | /api/ai-reviews/:submissionId | レビュー結果取得                                 |

POSTのリクエストボディ：

```json
{
  "submission_id": "uuid"
}
```

AIレビューPOSTの処理フロー：

1. usersテーブルのai_review_countを確認
2. 無料プランで3回以上・有料プランで30回以上なら403を返す
3. ai_review_reset_atが1ヶ月以上前なら回数をリセット
4. submissionsテーブルからコード・テスト結果・lesson情報を取得
5. テスト結果に応じて不合格用・合格用プロンプトを選択
6. Claude APIを呼び出してレビュー生成
7. ai_reviewsテーブルに保存
8. usersテーブルのai_review_countを+1

### 進捗系

| メソッド | エンドポイント          | 内容                               |
| -------- | ----------------------- | ---------------------------------- |
| GET      | /api/progress           | ログインユーザーの学習進捗一覧取得 |
| PATCH    | /api/progress/:lessonId | 進捗更新                           |

PATCHのリクエストボディ：

```json
{
  "status": "not_started | in_progress | completed"
}
```

### ユーザー系

| メソッド | エンドポイント                | 内容                   |
| -------- | ----------------------------- | ---------------------- |
| GET      | /api/users/me                 | 自分の情報取得         |
| PATCH    | /api/users/me                 | プロフィール更新       |
| GET      | /api/users/me/ai-review-count | AIレビュー残り回数取得 |

---

## 認証設計

Supabaseの認証機能を使用。

対応認証：

- メール＋パスワード
- Google OAuth

実装方法：

- @supabase/ssr パッケージを使用
- lib/supabase/client.ts にブラウザ用クライアントを作成
- lib/supabase/server.ts にサーバー用クライアントを作成
- middleware.tsでセッションの更新処理を実装

---

## テストケース管理（MVP）

MVPではコードにべた書き。
lib/testCases.tsにLesson IDをキーとしたオブジェクトで管理する。

```typescript
export const testCases: Record<string, TestCase[]> = {
  "lesson-id-1": [{ input: "", expected: "田中\n佐藤\n鈴木" }],
};
```

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

---

## 画面一覧と仕様

### ログイン画面（/login）

- メール＋パスワードのログインフォーム
- Googleログインボタン
- 新規登録ページへのリンク

### 新規登録画面（/register）

- メール＋パスワードの登録フォーム
- Googleログインボタン
- ログインページへのリンク
- 登録完了後はウェルカム画面へ遷移

### ウェルカム画面（/welcome）

- 「ようこそ!」のメッセージ
- サービスでできること3点を簡潔に表示
- 「さっそく始める」ボタン → Pythonコーストップへ遷移
- 初回ログイン時のみ表示

### ダッシュボード（/dashboard）

- コースごとの横プログレスバー＋完了Lesson数を表示
- 「続きから始める」ボタン（最後に取り組んだLessonへ遷移）
- プログレスバーの色：未着手グレー・進行中オレンジ・完了グリーン

### コース一覧（/courses）

- コースカードを一覧表示
- 各カードにコース名・言語・進捗を表示

### Level一覧（/courses/[courseId]）

- Level一覧を表示
- 各Levelに3段階のステータスアイコンを表示
  - not_started：グレー
  - in_progress：黄色・オレンジ系＋進行中アイコン
  - completed：緑系＋チェックマーク

### Lesson一覧（/courses/[courseId]/levels/[levelId]）

- Lesson一覧を表示
- 各Lessonに3段階のステータスアイコンを表示（Level一覧と同様）
- Level全Lesson完了時はLevelサマリーを表示
  - 学んだこと（概念・構文の一覧）
  - 実装したこと（一言まとめ）
  - 次のLevelの予告

### Lesson画面（/lessons/[lessonId]）

左右分割レイアウト。

左側：教材エリア

- 教材本文（説明文＋コードスニペット）
- 問題文
- ヒントボタン（押したときだけヒントを表示）

右側上：エディタエリア

- Monaco Editor
- 言語表示（Python）
- initial_codeを初期表示

右側下：結果エリア

- 「テストを実行する」ボタン
- テスト結果表示（passed / failed・失敗したテストケースの詳細）
- テスト不合格時：「もう一度試してみよう!」メッセージ
- テスト合格時：「合格!」表示＋次のLessonへ進むボタン
- 「AIレビューを受ける」ボタン
- 残り回数表示（例：今月の残り回数：2回 / 3回）
- 残り0回の場合：ボタンをグレーアウト＋「プランをアップグレードする」リンク
- AIレビュー表示エリア

### 学習進捗画面（/progress）

- 全Lessonの完了状況を一覧表示
- ステータスアイコン付き（3段階）

### 料金プラン画面（/pricing）

- 無料プランと有料プランの比較表
- 「14日間無料で始める」ボタン → Stripeの決済画面へ遷移

---

## プラン別の制限

| プラン | AIレビュー回数/月 |
| ------ | ----------------- |
| free   | 3回               |
| paid   | 30回              |

月次リセット：ai_review_reset_atから1ヶ月経過していたらai_review_countを0にリセット。

---

## Piston APIの使い方

エンドポイント：https://emkc.org/api/v2/piston/execute

リクエスト例：

```json
{
  "language": "python",
  "version": "3.10.0",
  "files": [
    {
      "content": "ユーザーのコード"
    }
  ],
  "stdin": "テストの入力値"
}
```

レスポンスのrun.stdoutと期待する出力値を比較してpassed / failedを判定する。

---

## エラー監視

Sentryを使用。
@sentry/nextjsパッケージでNext.jsに組み込む。
sentry.client.config.ts・sentry.server.config.tsを作成してDSNを設定する。

---

## 実装時の注意事項

- SupabaseのRow Level Security（RLS）を必ず有効にする
- 各テーブルのRLSポリシー：ユーザーは自分のデータのみ読み書き可能
- APIキーはサーバーサイドのみで使用し、クライアントに露出しない
- Claude APIの呼び出しはAPI Routes内のみで行う
- Piston APIのレスポンスタイムアウトは10秒に設定する
- Monaco Editorはdynamic importでSSRを無効にして読み込む
