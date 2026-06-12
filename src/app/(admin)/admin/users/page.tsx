import { createAdminClient } from '@/lib/supabase/admin'
import { UserTable } from './UserTable'
import type { UserRow } from './UserTable'

export default async function AdminUsersPage() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('users')
    .select('id, email, role, plan, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const users = (data ?? []) as UserRow[]

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">ユーザー管理</h1>
      <UserTable users={users} />
    </div>
  )
}
