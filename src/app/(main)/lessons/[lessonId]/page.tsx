import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LessonClient from './LessonClient'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>
}) {
  const { lessonId } = await params
  const supabase = await createClient()

  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single()

  if (error || !lesson) {
    notFound()
  }

  // 同じLevel内の次のLessonを取得
  const { data: nextLesson } = await supabase
    .from('lessons')
    .select('id')
    .eq('level_id', lesson.level_id)
    .gt('order', lesson.order)
    .order('order', { ascending: true })
    .limit(1)
    .single()

  return <LessonClient lesson={lesson} nextLessonId={nextLesson?.id ?? null} />
}
