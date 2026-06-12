export function extractLanguage(courses: unknown): string {
  if (Array.isArray(courses) && courses[0]?.language) {
    return String(courses[0].language)
  }
  if (courses && typeof courses === 'object' && 'language' in courses) {
    return String((courses as { language: unknown }).language ?? 'Python')
  }
  return 'Python'
}
