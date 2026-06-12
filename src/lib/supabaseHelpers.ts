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
