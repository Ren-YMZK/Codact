'use client'

import { useState } from 'react'
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

interface LessonClientProps {
  lesson: Lesson
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

export default function LessonClient({ lesson }: LessonClientProps) {
  const [code, setCode] = useState(lesson.initial_code)
  const [showHint, setShowHint] = useState(false)

  // DBに literal \n（バックスラッシュ+n）が保存されている場合の正規化
  const content = lesson.content.replace(/\\n/g, '\n')

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 左側：教材エリア */}
      <div className="w-2/5 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
        {/* ヘッダー */}
        <div className="shrink-0 px-6 py-4 border-b border-gray-100">
          <h1 className="text-base font-semibold text-gray-900 leading-snug">
            {lesson.title}
          </h1>
        </div>

        {/* コンテンツ（スクロール） */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-gray-900">
          <div>
            <Markdown components={mdComponents}>{content}</Markdown>
          </div>

          {/* ヒント */}
          {lesson.hint && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${showHint ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
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
          {/* エディタヘッダー */}
          <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-gray-700">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Python</span>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              value={code}
              language="python"
              onChange={setCode}
            />
          </div>
        </div>

        {/* 結果エリア */}
        <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-4 flex flex-col gap-3">
          {/* ボタン行 */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              テストを実行する
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              AIレビューを受ける
            </button>
          </div>

          {/* 残り回数 */}
          <p className="text-xs text-gray-400">
            今月の残り回数：<span className="font-medium text-gray-600">- / -</span>
          </p>
        </div>
      </div>
    </div>
  )
}
