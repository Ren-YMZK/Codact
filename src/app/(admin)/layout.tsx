import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/dashboard')
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userRow?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
        <Link href="/admin" className="font-bold text-gray-900 text-sm">管理者</Link>
        <Link href="/admin/courses" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">コース管理</Link>
        <Link href="/admin/stats" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">統計</Link>
        <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">ユーザー</Link>
        <div className="ml-auto">
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">← サービスへ戻る</Link>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
