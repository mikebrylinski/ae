import { Link } from 'react-router-dom'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { pressAnchorProps, pressHref } from '@/lib/content'
import type { PressItem } from '@/types'

type PressNavLinkProps = {
  item: PressItem
  className?: string
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'target' | 'rel' | 'type'>

/** Internal detail routes use React Router; PDFs and external URLs open in a new tab. */
export function PressNavLink({
  item,
  className,
  children,
  ...rest
}: PressNavLinkProps) {
  const href = pressHref(item)
  if (!href) return null

  if (item.detailPath) {
    return (
      <Link to={href} className={className} {...rest}>
        {children}
      </Link>
    )
  }

  const anchor = pressAnchorProps(item)
  if (!anchor) return null

  return (
    <a {...anchor} className={className} {...rest}>
      {children}
    </a>
  )
}
