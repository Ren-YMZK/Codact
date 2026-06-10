import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { getPlanLimit, applyMonthlyResetIfNeeded } from '@/lib/aiReview'

const PROMPT_FAILED = `あなたはプログラミング学習サービスのメンターです。
プログラミング初心者に対して、コードレビューを行ってください。

# ルール
- 答えやフルコードは絶対に出力しない
- 初心者にわかりやすい言葉で説明する
- 丁寧だけど堅すぎない口調にする
- ビックリマークは積極的に使う
- 絵文字は使わない
- ヒントは次の一手がわかる程度にとどめる
- 出力は5〜10行程度にする

# 学習済みの概念
{learned_concepts}

# 制約
- 学習済みの概念の範囲内でのみアドバイスする
- まだ学んでいない概念・構文は使わない

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
（答えは出さず、次の一手となるヒントのみ）`

const PROMPT_PASSED = `あなたはプログラミング学習サービスのメンターです。
テストに合格したコードに対して、実務目線でのレビューを行ってください。

# ルール
- 初心者にわかりやすい言葉で説明する
- 実務でどう使われるかの観点を含める
- 改善提案は押しつけにならないよう提案ベースにする
- 丁寧だけど堅すぎない口調にする
- ビックリマークは積極的に使う
- 絵文字は使わない
- 出力は3〜7行程度にする

# 学習済みの概念
{learned_concepts}

# 制約
- 学習済みの概念の範囲内でのみアドバイスする
- まだ学んでいない概念・構文は使わない

# 問題文
{problem}

# 提出コード
{code}

# 出力形式
【良い点】
（良い点を1〜2点）

【実務的な改善提案】
（実務観点での改善ポイントと理由）`

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { submission_id } = body as { submission_id: string }

  if (!submission_id) {
    return NextResponse.json({ error: 'submission_id は必須です' }, { status: 400 })
  }

  // ユーザー情報取得
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('plan, ai_review_count, ai_review_reset_at')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    return NextResponse.json({ error: 'ユーザー情報の取得に失敗しました' }, { status: 500 })
  }

  // 1ヶ月以上経過していたらリセット
  const count = await applyMonthlyResetIfNeeded(
    supabase,
    user.id,
    userData.ai_review_count,
    userData.ai_review_reset_at,
  )

  // 残り回数チェック
  const limit = getPlanLimit(userData.plan)
  if (count >= limit) {
    return NextResponse.json({ error: 'AIレビューの回数上限に達しました' }, { status: 403 })
  }

  // 提出情報取得
  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .select('code, status, test_result, lesson_id')
    .eq('id', submission_id)
    .eq('user_id', user.id)
    .single()

  if (subError || !submission) {
    return NextResponse.json({ error: '提出情報の取得に失敗しました' }, { status: 404 })
  }

  // Lesson情報取得（level_id も含む）
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('content, level_id')
    .eq('id', submission.lesson_id)
    .single()

  if (lessonError || !lesson) {
    return NextResponse.json({ error: 'Lesson情報の取得に失敗しました' }, { status: 404 })
  }

  // Level情報取得（order・course_id）
  const { data: level } = await supabase
    .from('levels')
    .select('order, course_id')
    .eq('id', lesson.level_id)
    .single()

  // 学習済み概念を取得（同コース内の現在Level以下の全concepts）
  let learnedConcepts = '（概念情報なし）'
  if (level) {
    const { data: conceptLevels } = await supabase
      .from('levels')
      .select('concepts')
      .eq('course_id', level.course_id)
      .lte('"order"', level.order)
    const allConcepts = (conceptLevels ?? []).flatMap((l) => l.concepts ?? [])
    if (allConcepts.length > 0) {
      learnedConcepts = allConcepts.join('、')
    }
  }

  // プロンプト選択・組み立て
  const isPassed = submission.status === 'passed'
  const testResultText = isPassed
    ? '全テストケースに合格しました'
    : JSON.stringify(submission.test_result, null, 2)

  const prompt = isPassed
    ? PROMPT_PASSED
        .replace('{learned_concepts}', learnedConcepts)
        .replace('{problem}', lesson.content)
        .replace('{code}', submission.code)
    : PROMPT_FAILED
        .replace('{learned_concepts}', learnedConcepts)
        .replace('{problem}', lesson.content)
        .replace('{test_result}', testResultText)
        .replace('{code}', submission.code)

  // Claude API呼び出し
  let review: string
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    review = message.content[0].type === 'text' ? message.content[0].text : ''
  } catch {
    return NextResponse.json({ error: 'AIレビューの生成に失敗しました' }, { status: 503 })
  }

  // ai_reviews保存とai_review_count+1をアトミックに実行
  const { error: rpcError } = await supabase.rpc('save_ai_review_and_increment', {
    p_user_id: user.id,
    p_submission_id: submission_id,
    p_review: review,
  })

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 })
  }

  return NextResponse.json({ review })
}
