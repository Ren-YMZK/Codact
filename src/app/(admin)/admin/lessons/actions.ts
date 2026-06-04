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

export async function addLesson(formData: FormData) {
  await assertAdmin()
  const admin = createAdminClient()
  const hint = (formData.get('hint') as string).trim()
  await admin.from('lessons').insert({
    level_id: formData.get('level_id') as string,
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    initial_code: formData.get('initial_code') as string,
    hint: hint || null,
    order: Number(formData.get('order')) || 0,
  })
  revalidatePath('/admin/lessons')
}

export async function deleteLesson(formData: FormData) {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('lessons').delete().eq('id', formData.get('id') as string)
  revalidatePath('/admin/lessons')
}

export async function addTestCase(formData: FormData) {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('test_cases').insert({
    lesson_id: formData.get('lesson_id') as string,
    input: formData.get('input') as string,
    expected: formData.get('expected') as string,
    order: Number(formData.get('order')) || 0,
  })
  revalidatePath('/admin/lessons')
}

export async function deleteTestCase(formData: FormData) {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('test_cases').delete().eq('id', formData.get('id') as string)
  revalidatePath('/admin/lessons')
}
