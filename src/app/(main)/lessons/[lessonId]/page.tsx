import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LessonClient from './LessonClient'
import { extractLanguage } from '@/lib/supabaseHelpers'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>
}) {
  const { lessonId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single()

  if (error || !lesson) {
    notFound()
  }

  const currentOrder = Number(lesson.order)

  const [
    { data: level },
    nextResult,
    prevResult,
  ] = await Promise.all([
    supabase.from('levels').select('id, order, course_id, concepts, built, next_preview, is_practice, courses(language)').eq('id', lesson.level_id).single(),
    supabase
      .from('lessons')
      .select('id')
      .eq('level_id', lesson.level_id)
      .gt('"order"', currentOrder)
      .order('order', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('lessons')
      .select('id')
      .eq('level_id', lesson.level_id)
      .lt('"order"', currentOrder)
      .order('order', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const nextLesson = nextResult.data
  const prevLesson = prevResult.data

  const isPracticeLevel = (level as { is_practice?: boolean } | null)?.is_practice === true

  const isLastLesson = nextLesson === null
  const levelSummary = isLastLesson && level?.built ? {
    concepts: (level.concepts as string[] | null) ?? [],
    built: level.built as string,
    nextPreview: (level.next_preview as string | null) ?? null,
  } : null
  const levelUrl = level ? `/courses/${level.course_id}/levels/${level.id}` : '/courses'
  const language = extractLanguage(level?.courses)

  let passedCode: string | null = null
  if (user) {
    const { data: submission } = await supabase
      .from('submissions')
      .select('code')
      .eq('lesson_id', lessonId)
      .eq('user_id', user.id)
      .eq('status', 'passed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    passedCode = submission?.code ?? null
  }

  return (
    <LessonClient
      lesson={lesson}
      language={language}
      prevLessonId={isPracticeLevel ? null : (prevLesson?.id ?? null)}
      nextLessonId={isPracticeLevel ? null : (nextLesson?.id ?? null)}
      isLastLesson={isPracticeLevel ? false : isLastLesson}
      levelSummary={isPracticeLevel ? null : levelSummary}
      levelUrl={isPracticeLevel ? '/dashboard' : levelUrl}
      initialCode={passedCode ?? lesson.initial_code}
      passedCode={passedCode}
    />
  )
}
