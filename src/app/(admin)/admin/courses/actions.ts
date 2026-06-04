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

export async function addCourse(formData: FormData) {
  await assertAdmin()
  const admin = createAdminClient()
  const description = (formData.get('description') as string).trim()
  await admin.from('courses').insert({
    title: formData.get('title') as string,
    language: formData.get('language') as string,
    description: description || null,
    order: Number(formData.get('order')) || 0,
  })
  revalidatePath('/admin/courses')
}

export async function deleteCourse(formData: FormData) {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('courses').delete().eq('id', formData.get('id') as string)
  revalidatePath('/admin/courses')
}
