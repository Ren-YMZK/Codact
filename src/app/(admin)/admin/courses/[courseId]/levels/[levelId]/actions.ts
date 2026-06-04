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

export async function addLesson(formData: FormData) {
  await assertAdmin()
  const courseId = formData.get('courseId') as string
  const levelId = formData.get('levelId') as string
  const hint = (formData.get('hint') as string).trim()
  const admin = createAdminClient()
  await admin.from('lessons').insert({
    level_id: levelId,
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    initial_code: formData.get('initial_code') as string,
    hint: hint || null,
    order: Number(formData.get('order')) || 0,
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
  const admin = createAdminClient()
  await admin.from('test_cases').insert({
    lesson_id: formData.get('lesson_id') as string,
    input: formData.get('input') as string,
    expected: formData.get('expected') as string,
    order: Number(formData.get('order')) || 0,
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
