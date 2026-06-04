import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Status = 'not_started' | 'in_progress' | 'completed'

interface LevelSummary {
  concepts: string[]
  built: string
  nextPreview: string | null
}

// Levelのorderに応じたサマリーデータ（1始まり）
const LEVEL_SUMMARIES: Record<number, LevelSummary> = {
  1: {
    concepts: ['print()による出力', 'リスト（list）の作り方と使い方', 'インデックスによる要素の取り出し', 'for文による繰り返し処理'],
    built: '社員リストを作成し、全員の名前を一覧表示するプログラム',
    nextPreview: 'if文を使った条件分岐で、特定の部署の社員だけを絞り込む方法を学びます',
  },
  2: {
    concepts: ['if / elif / elseによる条件分岐', '比較演算子（== != > < >= <=）', 'and / or / notによる複合条件', 'inによるリスト検索', 'for + ifによる絞り込み', 'リストのリスト'],
    built: '部署や条件でフィルタリングする社員絞り込み機能',
    nextPreview: '関数（def）と戻り値（return）を使って、処理を再利用できる形にまとめます',
  },
  3: {
    concepts: ['def による関数定義', '引数（複数引数を含む）', 'returnによる戻り値', '戻り値を変数で受け取って使う', 'for + if + returnによる検索関数'],
    built: '名前で社員を検索し、部署を返す検索機能',
    nextPreview: 'dict（辞書）を使って、名前・部署をキーで管理する方法を学びます',
  },
  4: {
    concepts: ['dict（辞書）の作り方とキーによるアクセス', 'dictへの値の追加・変更', 'dictのリストによる複数社員の管理', 'append()によるリストへの追加', 'delによるリストからの削除'],
    built: '社員のdictリストに対して追加・削除・一覧表示を行う管理機能',
    nextPreview: '数値計算とf-stringを使って、社員の給与を計算・整形表示する方法を学びます',
  },
  5: {
    concepts: ['四則演算（+ - * /）と整数除算（//）', 'f-stringによる文字列フォーマット', 'f-string内での計算式の埋め込み', 'for + 合計変数による合計・平均の計算', '{:,}による3桁区切り表示'],
    built: '社員ごとの給与を計算し、3桁区切りで整形表示したうえで合計を出す給与計算機能',
    nextPreview: 'class（クラス）を使って、データと操作をひとまとめにする方法を学びます',
  },
  6: {
    concepts: ['classの定義とインスタンスの作成', '__init__による属性の初期化', 'selfの役割', '複数の属性を持つクラス', 'メソッドの中での属性の活用', 'インスタンスの複数作成', '属性の変更（状態管理）', '状態を変えるメソッド', '管理クラスによるリスト状態の保持'],
    built: '社員クラスと管理クラスを作り、追加・一覧・検索をオブジェクトとして実装した社員管理システム',
    nextPreview: 'try / exceptと条件チェックを使って、不正な入力を弾くバリデーション機能を学びます',
  },
  7: {
    concepts: ['try / exceptによるエラーのキャッチ', 'エラーの種類を指定したexcept', 'as eによるエラーメッセージの取得', 'ifによる事前バリデーション', 'raiseによる意図的なエラーの発生', 'raise + try / exceptの組み合わせ'],
    built: '空・重複チェック付きのバリデーション登録機能を持つ完全な社員管理システム',
    nextPreview: null,
  },
}

function StatusIcon({ status }: { status: Status }) {
  if (status === 'completed') {
    return (
      <span className="shrink-0 w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    )
  }
  if (status === 'in_progress') {
    return (
      <span className="shrink-0 w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
        <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
      </span>
    )
  }
  return (
    <span className="shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
      <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
    </span>
  )
}

export default async function LevelLessonsPage({
  params,
}: {
  params: Promise<{ courseId: string; levelId: string }>
}) {
  const { courseId, levelId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: course },
    { data: level },
    { data: lessons, error },
    { data: allLevels },
  ] = await Promise.all([
    supabase.from('courses').select('title').eq('id', courseId).single(),
    supabase.from('levels').select('id, title, order').eq('id', levelId).single(),
    supabase.from('lessons').select('id, title, order').eq('level_id', levelId).order('order', { ascending: true }),
    supabase.from('levels').select('id, order').eq('course_id', courseId).order('order', { ascending: true }),
  ])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500">レッスンの取得に失敗しました</p>
          <p className="mt-1 text-xs text-gray-400">{error.message}</p>
        </div>
      </div>
    )
  }

  // 進捗マップを構築（ログイン済みかつLessonが存在する場合のみ）
  const progressMap = new Map<string, Status>()
  if (user && lessons && lessons.length > 0) {
    const lessonIds = lessons.map((l) => l.id)
    const { data: progressRows } = await supabase
      .from('progress')
      .select('lesson_id, status')
      .eq('user_id', user.id)
      .in('lesson_id', lessonIds)

    if (progressRows) {
      for (const row of progressRows) {
        progressMap.set(row.lesson_id, row.status as Status)
      }
    }
  }

  // 全Lesson完了判定
  const allCompleted =
    lessons !== null &&
    lessons.length > 0 &&
    lessons.every((l) => progressMap.get(l.id) === 'completed')

  // このLevelの表示番号と次のLevel
  const levelIndex = allLevels?.findIndex((l) => l.id === levelId) ?? -1
  const levelNumber = levelIndex + 1
  const nextLevel = levelIndex >= 0 ? (allLevels?.[levelIndex + 1] ?? null) : null
  const summary = LEVEL_SUMMARIES[level?.order ?? levelNumber] ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* パンくず */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 flex-wrap">
          <Link href="/courses" className="hover:text-gray-600 transition-colors">コース一覧</Link>
          <span>/</span>
          <Link href={`/courses/${courseId}`} className="hover:text-gray-600 transition-colors">
            {course?.title ?? 'コース'}
          </Link>
          <span>/</span>
          <span className="text-gray-600">{level?.title ?? 'レベル'}</span>
        </nav>

        {/* ページタイトル */}
        <h1 className="text-2xl font-bold text-gray-900">{level?.title ?? 'レベル'}</h1>
        <p className="mt-1 text-sm text-gray-500">レッスンを順番に進めましょう</p>

        {/* Lesson一覧 */}
        {!lessons || lessons.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-400">レッスンがありません</p>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            {lessons.map((lesson, index) => {
              const status: Status = progressMap.get(lesson.id) ?? 'not_started'
              return (
                <Link
                  key={lesson.id}
                  href={`/lessons/${lesson.id}`}
                  className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 hover:border-blue-300 hover:shadow transition-all"
                >
                  <StatusIcon status={status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">Lesson {index + 1}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{lesson.title}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )
            })}
          </div>
        )}

        {/* Levelサマリー（全Lesson完了時） */}
        {allCompleted && summary && (
          <div className="mt-10 rounded-2xl border border-green-200 bg-green-50 px-6 py-7">
            {/* タイトル */}
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <h2 className="text-xl font-bold text-green-800">Level {levelNumber} クリア!</h2>
            </div>

            {/* 学んだこと */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">学んだこと</p>
              <ul className="space-y-1.5">
                {summary.concepts.map((concept) => (
                  <li key={concept} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-green-400" />
                    {concept}
                  </li>
                ))}
              </ul>
            </div>

            {/* 実装したこと */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">実装したこと</p>
              <p className="text-sm text-gray-700">{summary.built}</p>
            </div>

            {/* 次のLevelの予告 */}
            {nextLevel && (
              <div className="mb-6 px-4 py-3 bg-white border border-green-200 rounded-xl">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">次のLevel</p>
                <p className="text-sm text-gray-700">{summary.nextPreview}</p>
              </div>
            )}

            {/* 次へ進むボタン */}
            {nextLevel ? (
              <Link
                href={`/courses/${courseId}/levels/${nextLevel.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                次のLevelへ
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                コース一覧へ
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
