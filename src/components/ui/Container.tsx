const maxWidths = {
  xs: 'max-w-xl',
  narrow: 'max-w-3xl',
  wide: 'max-w-5xl',
} as const

interface Props {
  size?: keyof typeof maxWidths
  className?: string
  children: React.ReactNode
}

export function Container({ size = 'narrow', className = '', children }: Props) {
  return (
    <div className={`${maxWidths[size]} mx-auto px-4 ${className}`}>
      {children}
    </div>
  )
}
