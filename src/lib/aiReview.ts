export const FREE_LIMIT = 10
export const PAID_LIMIT = 30

export function getPlanLimit(plan: string, role?: string | null): number {
  if (role === 'vip') return PAID_LIMIT
  return plan === 'paid' ? PAID_LIMIT : FREE_LIMIT
}

export function isMonthlyResetNeeded(resetAtIso: string): boolean {
  return Date.now() - new Date(resetAtIso).getTime() >= 30 * 24 * 60 * 60 * 1000
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function applyMonthlyResetIfNeeded(
  supabase: any,
  userId: string,
  currentCount: number,
  resetAtIso: string,
): Promise<number> {
  if (!isMonthlyResetNeeded(resetAtIso)) return currentCount
  await supabase
    .from('users')
    .update({ ai_review_count: 0, ai_review_reset_at: new Date().toISOString() })
    .eq('id', userId)
  return 0
}
