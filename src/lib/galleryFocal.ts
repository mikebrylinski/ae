export function clampGalleryFocal(value: unknown, fallback = 50): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10))
}

export function galleryObjectPosition(focalX?: number, focalY?: number): string {
  return `${clampGalleryFocal(focalX)}% ${clampGalleryFocal(focalY)}%`
}

export function hasCustomGalleryFocal(focalX?: number, focalY?: number): boolean {
  return clampGalleryFocal(focalX) !== 50 || clampGalleryFocal(focalY) !== 50
}
