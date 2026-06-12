function toObj(val: unknown): Record<string, unknown> | null {
  if (!val || typeof val !== 'object') return null
  if (Array.isArray(val)) {
    const first = val[0]
    return first && typeof first === 'object' ? (first as Record<string, unknown>) : null
  }
  return val as Record<string, unknown>
}

export interface NextLessonInfo {
  id: string
  title: string
  levelTitle: string
  levelOrder: number
  courseTitle: string
}

export function extractNextLesson(val: unknown): NextLessonInfo | null {
  const lesson = toObj(val)
  if (!lesson || !('id' in lesson)) return null
  const level = toObj(lesson.levels)
  const course = level ? toObj(level.courses) : null
  return {
    id: String(lesson.id),
    title: String(lesson.title ?? ''),
    levelTitle: String(level?.title ?? ''),
    levelOrder: Number(level?.order ?? 0),
    courseTitle: String(course?.title ?? ''),
  }
}

export function extractLesson(val: unknown): { id: string; title: string } | null {
  if (!val || typeof val !== 'object') return null
  if (Array.isArray(val)) {
    const first = val[0]
    if (!first || typeof first !== 'object' || !('id' in first)) return null
    return {
      id: String((first as { id: unknown }).id),
      title: String((first as { title: unknown }).title),
    }
  }
  if (!('id' in val)) return null
  const obj = val as Record<string, unknown>
  return {
    id: String(obj.id),
    title: String(obj.title ?? ''),
  }
}

export function extractLanguage(courses: unknown): string {
  if (Array.isArray(courses) && courses[0]?.language) {
    return String(courses[0].language)
  }
  if (courses && typeof courses === 'object' && 'language' in courses) {
    return String((courses as { language: unknown }).language ?? 'Python')
  }
  return 'Python'
}
