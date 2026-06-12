type Status = 'not_started' | 'in_progress' | 'completed'

export function StatusIcon({ status }: { status: Status }) {
  if (status === 'completed') {
    return (
      <span className="shrink-0 w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    )
  }
  if (status === 'in_progress') {
    return (
      <span className="shrink-0 w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
        <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
      </span>
    )
  }
  return (
    <span className="shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
      <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
    </span>
  )
}
