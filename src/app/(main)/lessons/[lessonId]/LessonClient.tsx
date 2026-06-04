'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Markdown from 'react-markdown'
import type { Components } from 'react-markdown'
import CodeEditor from '@/components/editor/CodeEditor'

interface Lesson {
  id: string
  title: string
  content: string
  initial_code: string
  hint: string | null
  level_id: string
}

interface TestCaseResult {
  input: string
  expected: string
  actual: string
  passed: boolean
  stderr: string
}

interface SubmissionResult {
  id: string
  status: 'passed' | 'failed'
  test_result: TestCaseResult[]
}

interface LessonClientProps {
  lesson: Lesson
  nextLessonId: string | null
}

const mdComponents: Components = {
  p:          ({ children }) => <p className="mb-3 text-sm text-gray-700 leading-relaxed">{children}</p>,
  h1:         ({ children }) => <h1 className="text-lg font-bold text-gray-900 mt-5 mb-2">{children}</h1>,
  h2:         ({ children }) => <h2 className="text-base font-bold text-gray-900 mt-4 mb-2">{children}</h2>,
  h3:         ({ children }) => <h3 className="text-sm font-semibold text-gray-900 mt-3 mb-1">{children}</h3>,
  ul:         ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
  ol:         ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
  li:         ({ children }) => <li className="text-sm text-gray-700">{children}</li>,
  strong:     ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-300 pl-4 italic text-gray-600 my-3">{children}</blockquote>
  ),
  pre:        ({ children }) => (
    <pre className="bg-gray-100 rounded-lg p-3 overflow-x-auto my-3 text-xs font-mono text-gray-800">{children}</pre>
  ),
  code:       ({ children, className }) => {
    const isBlock = Boolean(className?.includes('language-'))
    return isBlock
      ? <code className={`${className ?? ''} text-xs font-mono text-gray-800`}>{children}</code>
      : <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-gray-800">{children}</code>
  },
}

export default function LessonClient({ lesson, nextLessonId }: LessonClientProps) {
  const [code, setCode] = useState(lesson.initial_code)
  const [showHint, setShowHint] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<SubmissionResult | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [reviewCount, setReviewCount] = useState<{ remaining: number; limit: number } | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewText, setReviewText] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const content = lesson.content.replace(/\\n/g, '\n')

  async function fetchReviewCount() {
    try {
      const res = await fetch('/api/users/me/ai-review-count')
      if (res.ok) {
        const data = await res.json()
        setReviewCount({ remaining: data.remaining, limit: data.limit })
      }
    } catch {
      // 残り回数取得失敗は無視
    }
  }

  // 初回マウント時に残り回数を取得
  useEffect(() => { fetchReviewCount() }, [])

  async function runTest() {
    setIsRunning(true)
    setResult(null)
    setRunError(null)
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lesson.id, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRunError(data.error ?? 'テストの実行に失敗しました')
        return
      }
      setResult({ id: data.submission.id, status: data.submission.status, test_result: data.test_result })
      setReviewText(null)
      setReviewError(null)
    } catch {
      setRunError('ネットワークエラーが発生しました')
    } finally {
      setIsRunning(false)
    }
  }

  async function requestReview() {
    if (!result?.id) return
    setIsReviewing(true)
    setReviewText(null)
    setReviewError(null)
    try {
      const res = await fetch('/api/ai-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: result.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setReviewError(data.error ?? 'AIレビューの取得に失敗しました')
        return
      }
      setReviewText(data.review)
      await fetchReviewCount()
    } catch {
      setReviewError('ネットワークエラーが発生しました')
    } finally {
      setIsReviewing(false)
    }
  }

  const passed = result?.status === 'passed'
  const failedCases = result?.test_result.filter((r) => !r.passed) ?? []
  const canReview = result !== null && (reviewCount === null || reviewCount.remaining > 0)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 左側：教材エリア */}
      <div className="w-2/5 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
        <div className="shrink-0 px-6 py-4 border-b border-gray-100">
          <h1 className="text-base font-semibold text-gray-900 leading-snug">
            {lesson.title}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 text-gray-900">
          <div>
            <Markdown components={mdComponents}>{content}</Markdown>
          </div>

          {lesson.hint && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${showHint ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                {showHint ? 'ヒントを閉じる' : 'ヒントを見る'}
              </button>
              {showHint && (
                <div className="mt-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 leading-relaxed">
                  {lesson.hint}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 右側 */}
      <div className="w-3/5 flex flex-col bg-gray-50 overflow-hidden">
        {/* エディタエリア */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 flex items-center px-4 py-2 bg-[#1e1e1e] border-b border-gray-700">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Python</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <CodeEditor value={code} language="python" onChange={setCode} />
          </div>
        </div>

        {/* 結果エリア */}
        <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-4 flex flex-col gap-3 max-h-64 overflow-y-auto">
          {/* ボタン行 */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={runTest}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {isRunning && (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isRunning ? '実行中...' : 'テストを実行する'}
            </button>
            <button
              type="button"
              onClick={requestReview}
              disabled={!canReview || isReviewing}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {isReviewing ? 'レビュー中...' : 'AIレビューを受ける'}
            </button>
          </div>

          {/* 残り回数 */}
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400">
              今月の残り回数：
              <span className="font-medium text-gray-600">
                {reviewCount !== null ? `${reviewCount.remaining} / ${reviewCount.limit}` : '- / -'}
              </span>
            </p>
            {reviewCount !== null && reviewCount.remaining === 0 && (
              <a href="/pricing" className="text-xs text-blue-600 hover:underline">
                プランをアップグレードする
              </a>
            )}
          </div>

          {/* AIレビューエラー */}
          {reviewError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {reviewError}
            </div>
          )}

          {/* AIレビュー結果 */}
          {reviewText && (
            <div className="px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-xs font-semibold text-purple-700 mb-2">AIレビュー</p>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">{reviewText}</pre>
            </div>
          )}

          {/* エラー表示 */}
          {runError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {runError}
            </div>
          )}

          {/* テスト結果 */}
          {result && (
            <div className={`rounded-lg border px-4 py-3 ${passed ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              {passed ? (
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-bold text-green-700">合格!</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      全 {result.test_result.length} テストをクリアしました
                    </p>
                  </div>
                  {nextLessonId ? (
                    <Link
                      href={`/lessons/${nextLessonId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      次のLessonへ
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : (
                    <Link
                      href="/courses"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      コース一覧へ
                    </Link>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-orange-700">もう一度試してみよう!</p>
                  <div className="mt-2 space-y-2">
                    {failedCases.map((fc, i) => (
                      <div key={i} className="text-xs text-gray-700 space-y-1">
                        {fc.stderr && (
                          <div>
                            <span className="font-medium text-red-600">エラー：</span>
                            <pre className="mt-0.5 bg-red-50 rounded p-1.5 text-red-700 overflow-x-auto whitespace-pre-wrap">{fc.stderr}</pre>
                          </div>
                        )}
                        {!fc.stderr && (
                          <>
                            <div>
                              <span className="font-medium">期待値：</span>
                              <pre className="mt-0.5 bg-white rounded p-1.5 border border-gray-200 overflow-x-auto">{fc.expected}</pre>
                            </div>
                            <div>
                              <span className="font-medium">実際の出力：</span>
                              <pre className="mt-0.5 bg-white rounded p-1.5 border border-gray-200 overflow-x-auto">{fc.actual || '（出力なし）'}</pre>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
