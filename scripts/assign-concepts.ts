/**
 * scripts/assign-concepts.ts
 * 全Lessonに概念マスタからClaude APIで概念を自動紐づけする一発スクリプト
 *
 * Usage:
 *   npx tsx scripts/assign-concepts.ts              # 5件ドライラン（デフォルト）
 *   npx tsx scripts/assign-concepts.ts --limit 10   # 10件ドライラン
 *   npx tsx scripts/assign-concepts.ts --all        # 全件ドライラン
 *   npx tsx scripts/assign-concepts.ts --write      # 5件・実際に書き込み
 *   npx tsx scripts/assign-concepts.ts --all --write # 全件書き込み
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// ---- クライアント初期化 ----

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ---- 型定義 ----

interface Concept {
  id: string
  name: string
  category: string | null
}

interface LessonRow {
  id: string
  title: string
  content: string
  levels: {
    id: string
    title: string
    order: number
    concepts: string[] | null
    courses: {
      title: string
      language: string
    } | null
  } | null
}

// ---- ヘルパー ----

function toObj<T>(val: T | T[]): T | null {
  if (Array.isArray(val)) return val[0] ?? null
  return val ?? null
}

function safeLevel(val: unknown): LessonRow['levels'] {
  if (!val || typeof val !== 'object') return null
  if (Array.isArray(val)) {
    const first = val[0]
    return first && typeof first === 'object' ? (first as LessonRow['levels']) : null
  }
  return val as LessonRow['levels']
}

function extractConceptIds(text: string, validIds: Set<string>): string[] {
  const match = text.match(/<result>\s*([\s\S]*?)\s*<\/result>/)
  if (!match) return []
  try {
    const parsed: unknown = JSON.parse(match[1].trim())
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string' && validIds.has(id))
  } catch {
    return []
  }
}

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

// ---- プロンプト ----

function buildPrompt(
  courseTitle: string,
  language: string,
  levelTitle: string,
  levelConcepts: string[],
  lessonTitle: string,
  lessonContent: string,
  concepts: Concept[],
): string {
  const contentSnippet = lessonContent.slice(0, 2000)
  const levelHint = levelConcepts.length > 0 ? levelConcepts.join('、') : '（未設定）'
  const conceptsJson = JSON.stringify(
    concepts.map(c => ({ id: c.id, name: c.name, category: c.category })),
    null,
    2,
  )

  return `あなたはプログラミング教育コンテンツの分類専門家です。

以下のプログラミング学習Lessonの内容を分析し、このLessonが扱っている概念を概念マスタから選択してください。

# Lesson情報
コース: ${courseTitle}（${language}）
Level: ${levelTitle}
Levelの学習テーマ（ヒント）: ${levelHint}
Lesson: ${lessonTitle}

# Lesson内容
${contentSnippet}

# 概念マスタ（全${concepts.length}件）
${conceptsJson}

# 選択基準
- このLessonが直接教えている・練習させている概念のみ選ぶ
- Levelの学習テーマはヒントとして参考にする
- マスタに存在するIDのみ使うこと（独自IDを作らない）
- 1Lessonにつき通常1〜4個、多くても5個まで
- 周辺知識・前提知識・応用例は含めない（直接の学習対象のみ）

# 出力形式
選択した概念IDのJSON配列のみを<result>タグで囲んで返すこと。それ以外のテキストは不要。

<result>
["概念ID1", "概念ID2"]
</result>`
}

// ---- メイン ----

async function main() {
  // CLIパース
  const argv = process.argv.slice(2)
  const isDryRun = !argv.includes('--write')
  const isAll = argv.includes('--all')

  let limit = 5
  const limitIdx = argv.indexOf('--limit')
  if (limitIdx !== -1 && argv[limitIdx + 1]) {
    const parsed = parseInt(argv[limitIdx + 1], 10)
    if (!isNaN(parsed) && parsed > 0) limit = parsed
  }
  if (isAll) limit = 10_000

  console.log(`\n=== assign-concepts ===`)
  console.log(`モード: ${isDryRun ? 'ドライラン（書き込みなし）' : '書き込みあり'}`)
  console.log(`対象: ${isAll ? '全件' : `${limit}件`}\n`)

  // 概念マスタ取得
  const { data: concepts, error: conceptsError } = await supabase
    .from('concepts')
    .select('id, name, category')
    .order('id')

  if (conceptsError) {
    console.error('概念マスタの取得に失敗しました:', conceptsError.message)
    process.exit(1)
  }
  if (!concepts || concepts.length === 0) {
    console.error('概念マスタが空です。先にconceptsテーブルにデータを投入してください。')
    process.exit(1)
  }

  const validIds = new Set(concepts.map(c => c.id))
  console.log(`概念マスタ: ${concepts.length}件読み込み\n`)

  // Lesson一覧取得（level/course情報を含む）
  const { data: rawLessons, error: lessonsError } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      content,
      levels (
        id,
        title,
        order,
        concepts,
        courses (
          title,
          language
        )
      )
    `)
    .order('id')
    .limit(limit)

  if (lessonsError) {
    console.error('Lessonの取得に失敗しました:', lessonsError.message)
    process.exit(1)
  }
  if (!rawLessons || rawLessons.length === 0) {
    console.log('処理対象のLessonがありません。')
    process.exit(0)
  }

  const lessons = rawLessons as unknown as LessonRow[]
  console.log(`対象Lesson: ${lessons.length}件\n`)
  console.log('─'.repeat(60))

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i]
    const level = safeLevel(lesson.levels)
    const course = level ? toObj(level.courses) : null

    const courseTitle = course?.title ?? '（不明）'
    const language = course?.language ?? 'Python'
    const levelTitle = level?.title ?? '（不明）'
    const levelConcepts = level?.concepts ?? []

    const prefix = `${i + 1}/${lessons.length} ${courseTitle} / ${levelTitle} / ${lesson.title}`

    // Claude API 呼び出し
    let conceptIds: string[] = []
    try {
      const prompt = buildPrompt(
        courseTitle,
        language,
        levelTitle,
        levelConcepts,
        lesson.title,
        lesson.content,
        concepts as Concept[],
      )

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      conceptIds = extractConceptIds(text, validIds)

      if (conceptIds.length === 0) {
        console.warn(`  [警告] ${prefix}`)
        console.warn(`    概念IDを抽出できませんでした。レスポンス: ${text.slice(0, 200)}`)
        skipCount++
      } else {
        const conceptNames = conceptIds.map(id => {
          const c = (concepts as Concept[]).find(c => c.id === id)
          return c ? c.name : id
        })
        console.log(`  ${prefix}`)
        console.log(`    → [${conceptNames.join(', ')}]`)

        if (!isDryRun) {
          const rows = conceptIds.map(cid => ({ lesson_id: lesson.id, concept_id: cid }))
          const { error: upsertError } = await supabase
            .from('lesson_concepts')
            .upsert(rows, { onConflict: 'lesson_id,concept_id', ignoreDuplicates: true })

          if (upsertError) {
            console.error(`    [エラー] upsert失敗: ${upsertError.message}`)
            errorCount++
          } else {
            successCount++
          }
        } else {
          successCount++
        }
      }
    } catch (err) {
      console.error(`  [エラー] ${prefix}: ${err instanceof Error ? err.message : String(err)}`)
      errorCount++
    }

    // rate limit 回避
    if (i < lessons.length - 1) {
      await delay(300)
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`\n完了:`)
  console.log(`  成功: ${successCount}件`)
  if (skipCount > 0) console.log(`  スキップ（概念なし）: ${skipCount}件`)
  if (errorCount > 0) console.log(`  エラー: ${errorCount}件`)
  if (isDryRun) console.log('\n  ※ドライランのため書き込みは行いませんでした。--writeを付けて再実行すると書き込みます。')
}

main().catch(err => {
  console.error('予期しないエラー:', err)
  process.exit(1)
})
