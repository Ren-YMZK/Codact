import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LEVEL_SUMMARIES } from '@/lib/levelSummaries'
import LessonClient from './LessonClient'

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

  const [
    { data: level },
    { data: nextLesson },
  ] = await Promise.all([
    supabase.from('levels').select('id, order, course_id').eq('id', lesson.level_id).single(),
    supabase
      .from('lessons')
      .select('id')
      .eq('level_id', lesson.level_id)
      .gt('order', lesson.order)
      .order('order', { ascending: true })
      .limit(1)
      .single(),
  ])

  const isLastLesson = nextLesson === null
  const levelSummary = isLastLesson && level ? (LEVEL_SUMMARIES[level.order] ?? null) : null
  const levelUrl = level ? `/courses/${level.course_id}/levels/${level.id}` : '/courses'

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
      nextLessonId={nextLesson?.id ?? null}
      isLastLesson={isLastLesson}
      levelSummary={levelSummary}
      levelUrl={levelUrl}
      initialCode={passedCode ?? lesson.initial_code}
      passedCode={passedCode}
    />
  )
}
