'use client'

import { useState, useEffect } from 'react'

export type LessonStatRow = {
  course_id: string
  course_title: string
  level_order: number
  level_title: string
  lesson_id: string
  lesson_title: string
  lesson_order: number
  completed_count: number
  in_progress_count: number
  submission_count: number
  ai_review_count: number
  course_started_users: number
}

const LS_KEY = 'codact_admin_stats_expanded'
type SavedState = { courses: string[]; levels: string[] }

function loadSaved(): SavedState {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { courses: [], levels: [] }
    return JSON.parse(raw) as SavedState
  } catch {
    return { courses: [], levels: [] }
  }
}

function fmt(n: number): string {
  return n.toLocaleString()
}

// average of (numerators[i] / denominator) across all i
function avgPct(numerators: number[], denominator: number): string {
  if (denominator === 0 || numerators.length === 0) return '-'
  const sum = numerators.reduce((acc, val) => acc + val, 0)
  return `${((sum / numerators.length / denominator) * 100).toFixed(1)}%`
}

function avgStr(submissions: number, completed: number): string {
  return completed > 0 ? (submissions / completed).toFixed(1) : '-'
}

function isStruggling(ls: LessonStatRow): boolean {
  if (ls.completed_count > 0 && ls.submission_count / ls.completed_count >= 3.0) return true
  if (ls.completed_count === 0 && ls.submission_count >= 3) return true
  return false
}

const CELL = 'w-20 shrink-0 text-right px-2 py-2.5 text-sm tabular-nums'
const HCELL = 'w-20 shrink-0 text-right px-2 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap'

export function StatsTree({ lessonStats }: { lessonStats: LessonStatRow[] }) {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set())
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const saved = loadSaved()
    setExpandedCourses(new Set(saved.courses))
    setExpandedLevels(new Set(saved.levels))
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          courses: Array.from(expandedCourses),
          levels: Array.from(expandedLevels),
        }),
      )
    } catch {
      // storage quota exceeded or private browsing — ignore
    }
  }, [expandedCourses, expandedLevels, isLoaded])

  // Build course → level → lesson tree
  const courseMap = new Map<
    string,
    {
      id: string
      title: string
      started: number
      levels: Map<string, { key: string; order: number; title: string; lessons: LessonStatRow[] }>
    }
  >()

  for (const row of lessonStats) {
    if (!courseMap.has(row.course_id)) {
      courseMap.set(row.course_id, {
        id: row.course_id,
        title: row.course_title,
        started: row.course_started_users,
        levels: new Map(),
      })
    }
    const c = courseMap.get(row.course_id)!
    const lk = `${row.course_id}__${row.level_order}`
    if (!c.levels.has(lk)) {
      c.levels.set(lk, { key: lk, order: row.level_order, title: row.level_title, lessons: [] })
    }
    c.levels.get(lk)!.lessons.push(row)
  }

  const courses = Array.from(courseMap.values())

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto mb-8">
      {/* Header */}
      <div className="flex items-center border-b border-gray-200 bg-gray-50 min-w-[680px]">
        <div className="flex-1 px-4 py-2 text-xs font-semibold text-gray-500">名前</div>
        <div className={HCELL}>完了人数</div>
        <div className={HCELL}>着手中</div>
        <div className={HCELL}>提出回数</div>
        <div className={HCELL}>平均提出</div>
        <div className={HCELL}>AIレビュー</div>
        <div className={HCELL}>完了率</div>
      </div>

      {courses.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-gray-400 min-w-[680px]">
          データがありません
        </div>
      ) : (
        <div className="min-w-[680px]">
          {courses.map(course => {
            const allLessons = Array.from(course.levels.values()).flatMap(lv => lv.lessons)
            const cCompleted = allLessons.reduce((s, l) => s + l.completed_count, 0)
            const cInProgress = allLessons.reduce((s, l) => s + l.in_progress_count, 0)
            const cSubmissions = allLessons.reduce((s, l) => s + l.submission_count, 0)
            const cAiReviews = allLessons.reduce((s, l) => s + l.ai_review_count, 0)
            const cRate = avgPct(allLessons.map(l => l.completed_count), course.started)
            const isCOpen = expandedCourses.has(course.id)

            return (
              <div key={course.id} className="border-b border-gray-100 last:border-0">
                {/* Course row */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCourses(prev => {
                      const n = new Set(prev)
                      if (n.has(course.id)) n.delete(course.id)
                      else n.add(course.id)
                      return n
                    })
                  }
                  className="w-full flex items-center hover:bg-gray-50 text-left"
                >
                  <div className="flex-1 min-w-0 px-4 py-2.5 flex items-center gap-2 font-semibold text-sm text-gray-900">
                    <span className="text-[10px] text-gray-400 shrink-0">{isCOpen ? '▼' : '▶'}</span>
                    <span className="truncate">{course.title}</span>
                  </div>
                  <div className={`${CELL} font-medium text-gray-900`}>{fmt(cCompleted)}</div>
                  <div className={`${CELL} text-gray-500`}>{fmt(cInProgress)}</div>
                  <div className={`${CELL} text-gray-700`}>{fmt(cSubmissions)}</div>
                  <div className={`${CELL} text-gray-500`}>{avgStr(cSubmissions, cCompleted)}</div>
                  <div className={`${CELL} text-gray-500`}>{fmt(cAiReviews)}</div>
                  <div className={`${CELL} text-gray-500`}>{cRate}</div>
                </button>

                {/* Level rows */}
                {isCOpen &&
                  Array.from(course.levels.values()).map(level => {
                    const lCompleted = level.lessons.reduce((s, l) => s + l.completed_count, 0)
                    const lInProgress = level.lessons.reduce((s, l) => s + l.in_progress_count, 0)
                    const lSubmissions = level.lessons.reduce((s, l) => s + l.submission_count, 0)
                    const lAiReviews = level.lessons.reduce((s, l) => s + l.ai_review_count, 0)
                    const lRate = avgPct(level.lessons.map(l => l.completed_count), course.started)
                    const isLOpen = expandedLevels.has(level.key)

                    return (
                      <div key={level.key} className="border-t border-gray-50">
                        {/* Level row */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedLevels(prev => {
                              const n = new Set(prev)
                              if (n.has(level.key)) n.delete(level.key)
                              else n.add(level.key)
                              return n
                            })
                          }
                          className="w-full flex items-center bg-gray-50/60 hover:bg-gray-100/60 text-left"
                        >
                          <div className="flex-1 min-w-0 pl-8 pr-4 py-2.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {isLOpen ? '▼' : '▶'}
                            </span>
                            <span className="truncate">
                              Level {level.order}&nbsp;{level.title}
                            </span>
                          </div>
                          <div className={`${CELL} text-gray-700`}>{fmt(lCompleted)}</div>
                          <div className={`${CELL} text-gray-500`}>{fmt(lInProgress)}</div>
                          <div className={`${CELL} text-gray-600`}>{fmt(lSubmissions)}</div>
                          <div className={`${CELL} text-gray-500`}>
                            {avgStr(lSubmissions, lCompleted)}
                          </div>
                          <div className={`${CELL} text-gray-500`}>{fmt(lAiReviews)}</div>
                          <div className={`${CELL} text-gray-500`}>{lRate}</div>
                        </button>

                        {/* Lesson rows */}
                        {isLOpen &&
                          level.lessons.map(ls => {
                            const isBad = isStruggling(ls)
                            const lsRate =
                              course.started > 0
                                ? `${((ls.completed_count / course.started) * 100).toFixed(1)}%`
                                : '-'

                            return (
                              <div
                                key={ls.lesson_id}
                                className={`flex items-center border-t border-gray-50 ${
                                  isBad ? 'bg-red-50' : 'hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex-1 min-w-0 pl-14 pr-4 py-2.5 text-sm text-gray-700 truncate">
                                  {ls.lesson_title}
                                </div>
                                <div className={`${CELL} font-medium text-gray-900`}>
                                  {fmt(ls.completed_count)}
                                </div>
                                <div className={`${CELL} text-gray-500`}>
                                  {fmt(ls.in_progress_count)}
                                </div>
                                <div className={`${CELL} text-gray-700`}>
                                  {fmt(ls.submission_count)}
                                </div>
                                <div
                                  className={`${CELL} ${
                                    isBad ? 'text-red-600 font-semibold' : 'text-gray-500'
                                  }`}
                                >
                                  {ls.completed_count > 0
                                    ? (ls.submission_count / ls.completed_count).toFixed(1)
                                    : '-'}
                                </div>
                                <div className={`${CELL} text-gray-500`}>
                                  {fmt(ls.ai_review_count)}
                                </div>
                                <div className={`${CELL} text-gray-500`}>{lsRate}</div>
                              </div>
                            )
                          })}
                      </div>
                    )
                  })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
