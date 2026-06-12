import Link from 'next/link'
import type { ComponentPropsWithoutRef } from 'react'

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700',
  danger: 'border border-red-200 text-red-600 hover:bg-red-50',
  success: 'bg-green-600 hover:bg-green-700 text-white',
} as const

const sizes = {
  sm: 'px-4 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
} as const

type Variant = keyof typeof variants
type Size = keyof typeof sizes

interface BaseProps {
  variant?: Variant
  size?: Size
  className?: string
  children: React.ReactNode
}

type AsLink = BaseProps & { href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, keyof BaseProps | 'href'>
type AsButton = BaseProps & { href?: never } & Omit<ComponentPropsWithoutRef<'button'>, keyof BaseProps>

type Props = AsLink | AsButton

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: Props) {
  const cls = [
    'inline-flex items-center justify-center gap-2',
    'rounded-xl font-semibold transition-colors',
    'cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
    variants[variant],
    sizes[size],
    className,
  ].join(' ')

  if ('href' in rest && rest.href !== undefined) {
    const { href, ...linkRest } = rest as AsLink
    return <Link href={href} className={cls} {...linkRest}>{children}</Link>
  }

  const { ...btnRest } = rest as AsButton
  return <button className={cls} {...btnRest}>{children}</button>
}
