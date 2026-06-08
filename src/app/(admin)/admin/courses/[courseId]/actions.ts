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

export async function moveLevel(formData: FormData) {
  await assertAdmin()
  const id = formData.get('id') as string
  const direction = formData.get('direction') as 'up' | 'down'
  const courseId = formData.get('courseId') as string
  const admin = createAdminClient()
  const { data: levels } = await admin
    .from('levels')
    .select('id, order')
    .eq('course_id', courseId)
    .order('order', { ascending: true })
  if (!levels) return
  const idx = levels.findIndex((l) => l.id === id)
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= levels.length) return
  const [a, b] = [levels[idx], levels[swapIdx]]
  await Promise.all([
    admin.from('levels').update({ order: b.order }).eq('id', a.id),
    admin.from('levels').update({ order: a.order }).eq('id', b.id),
  ])
  revalidatePath(`/admin/courses/${courseId}`)
}

export async function addLevel(formData: FormData) {
  await assertAdmin()
  const courseId = formData.get('courseId') as string
  const admin = createAdminClient()
  const { data: maxRow } = await admin.from('levels').select('order').eq('course_id', courseId).order('order', { ascending: false }).limit(1).single()
  const nextOrder = (maxRow?.order ?? 0) + 1
  await admin.from('levels').insert({
    course_id: courseId,
    title: formData.get('title') as string,
    order: nextOrder,
  })
  revalidatePath(`/admin/courses/${courseId}`)
}

export async function updateLevel(formData: FormData) {
  await assertAdmin()
  const courseId = formData.get('courseId') as string
  const admin = createAdminClient()
  await admin.from('levels').update({
    title: formData.get('title') as string,
    order: Number(formData.get('order')) || 0,
  }).eq('id', formData.get('id') as string)
  revalidatePath(`/admin/courses/${courseId}`)
}

export async function deleteLevel(formData: FormData) {
  await assertAdmin()
  const courseId = formData.get('courseId') as string
  const admin = createAdminClient()
  await admin.from('levels').delete().eq('id', formData.get('id') as string)
  revalidatePath(`/admin/courses/${courseId}`)
}
