'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard')
  const { data: row } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (row?.role !== 'admin') redirect('/dashboard')
}

function levelPath(courseId: string, levelId: string) {
  return `/admin/courses/${courseId}/levels/${levelId}`
}

export async function moveLesson(formData: FormData) {
  await assertAdmin()
  const id = formData.get('id') as string
  const direction = formData.get('direction') as 'up' | 'down'
  const courseId = formData.get('courseId') as string
  const levelId = formData.get('levelId') as string
  const admin = createAdminClient()
  const { data: lessons } = await admin
    .from('lessons')
    .select('id, order')
    .eq('level_id', levelId)
    .order('order', { ascending: true })
  if (!lessons) return
  const idx = lessons.findIndex((l) => l.id === id)
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= lessons.length) return
  const [a, b] = [lessons[idx], lessons[swapIdx]]
  await Promise.all([
    admin.from('lessons').update({ order: b.order }).eq('id', a.id),
    admin.from('lessons').update({ order: a.order }).eq('id', b.id),
  ])
  revalidatePath(levelPath(courseId, levelId))
}

export async function addLesson(formData: FormData) {
  await assertAdmin()
  const courseId = formData.get('courseId') as string
  const levelId = formData.get('levelId') as string
  const hint = (formData.get('hint') as string).trim()
  const admin = createAdminClient()
  const { data: maxRow } = await admin.from('lessons').select('order').eq('level_id', levelId).order('order', { ascending: false }).limit(1).single()
  const nextOrder = (maxRow?.order ?? 0) + 1
  await admin.from('lessons').insert({
    level_id: levelId,
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    initial_code: formData.get('initial_code') as string,
    hint: hint || null,
    order: nextOrder,
  })
  revalidatePath(levelPath(courseId, levelId))
}

export async function updateLesson(formData: FormData) {
  await assertAdmin()
  const courseId = formData.get('courseId') as string
  const levelId = formData.get('levelId') as string
  const hint = (formData.get('hint') as string).trim()
  const admin = createAdminClient()
  await admin.from('lessons').update({
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    initial_code: formData.get('initial_code') as string,
    hint: hint || null,
    order: Number(formData.get('order')) || 0,
  }).eq('id', formData.get('id') as string)
  revalidatePath(levelPath(courseId, levelId))
}

export async function deleteLesson(formData: FormData) {
  await assertAdmin()
  const courseId = formData.get('courseId') as string
  const levelId = formData.get('levelId') as string
  const admin = createAdminClient()
  await admin.from('lessons').delete().eq('id', formData.get('id') as string)
  revalidatePath(levelPath(courseId, levelId))
}

export async function addTestCase(formData: FormData) {
  await assertAdmin()
  const courseId = formData.get('courseId') as string
  const levelId = formData.get('levelId') as string
  const lessonId = formData.get('lesson_id') as string
  const admin = createAdminClient()
  const { data: maxRow } = await admin.from('test_cases').select('order').eq('lesson_id', lessonId).order('order', { ascending: false }).limit(1).single()
  const nextOrder = (maxRow?.order ?? 0) + 1
  await admin.from('test_cases').insert({
    lesson_id: lessonId,
    input: formData.get('input') as string,
    expected: formData.get('expected') as string,
    order: nextOrder,
  })
  revalidatePath(levelPath(courseId, levelId))
}

export async function updateTestCase(formData: FormData) {
  await assertAdmin()
  const courseId = formData.get('courseId') as string
  const levelId = formData.get('levelId') as string
  const admin = createAdminClient()
  await admin.from('test_cases').update({
    input: formData.get('input') as string,
    expected: formData.get('expected') as string,
    order: Number(formData.get('order')) || 0,
  }).eq('id', formData.get('id') as string)
  revalidatePath(levelPath(courseId, levelId))
}

export async function deleteTestCase(formData: FormData) {
  await assertAdmin()
  const courseId = formData.get('courseId') as string
  const levelId = formData.get('levelId') as string
  const admin = createAdminClient()
  await admin.from('test_cases').delete().eq('id', formData.get('id') as string)
  revalidatePath(levelPath(courseId, levelId))
}
