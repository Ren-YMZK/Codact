'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function ManageSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'エラーが発生しました')
        return
      }
      window.location.href = data.url
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Button variant="secondary" size="sm" onClick={handleClick} disabled={isLoading}>
        {isLoading ? '読み込み中...' : 'サブスクリプションを管理'}
      </Button>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}
