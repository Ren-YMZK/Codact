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

export async function addLevel(formData: FormData) {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('levels').insert({
    course_id: formData.get('course_id') as string,
    title: formData.get('title') as string,
    order: Number(formData.get('order')) || 0,
  })
  revalidatePath('/admin/levels')
}

export async function deleteLevel(formData: FormData) {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('levels').delete().eq('id', formData.get('id') as string)
  revalidatePath('/admin/levels')
}
