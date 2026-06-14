'use client'

interface Props {
  action: (formData: FormData) => Promise<void>
  hiddenFields: Record<string, string>
  confirmMessage?: string
}

export function DeleteButton({ action, hiddenFields, confirmMessage = '削除しますか?' }: Props) {
  return (
    <form action={action}>
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
        onClick={(e) => { if (!window.confirm(confirmMessage)) e.preventDefault() }}
      >
        削除
      </button>
    </form>
  )
}
