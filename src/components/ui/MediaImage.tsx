import { useState, type CSSProperties, type ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { PlaceholderMedia } from './PlaceholderMedia'

interface MediaImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackLabel?: string
  aspect?: string
  /** object-fit for the image. Use `contain` for logos on dark cards. */
  fit?: 'cover' | 'contain'
  wrapperClassName?: string
  wrapperStyle?: CSSProperties
}

export function MediaImage({
  src,
  alt = '',
  className,
  fallbackLabel,
  aspect = 'aspect-video',
  fit = 'cover',
  wrapperClassName,
  wrapperStyle,
  ...props
}: MediaImageProps) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (!src || failed) {
    return (
      <PlaceholderMedia
        label={fallbackLabel ?? alt ?? 'Photo coming soon'}
        aspect={aspect}
        className={wrapperClassName}
        style={wrapperStyle}
      />
    )
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden border border-border',
        fit === 'contain' ? 'bg-black' : 'bg-surface',
        aspect,
        wrapperClassName,
      )}
      style={wrapperStyle}
    >
      {!loaded ? (
        <div className="absolute inset-0 placeholder-media" aria-hidden />
      ) : null}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          'h-full w-full transition-opacity duration-500',
          fit === 'contain'
            ? 'object-contain object-center p-1'
            : 'object-cover',
          loaded ? 'opacity-100' : 'opacity-0',
          className,
        )}
        {...props}
      />
    </div>
  )
}
