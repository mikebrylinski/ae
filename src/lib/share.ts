function prefersNativeShare() {
  if (typeof navigator.share !== 'function') return false
  if (window.matchMedia('(pointer: coarse)').matches) return true
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

async function copyUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    try {
      const input = document.createElement('textarea')
      input.value = url
      input.setAttribute('readonly', '')
      input.style.position = 'fixed'
      input.style.left = '-9999px'
      document.body.appendChild(input)
      input.select()
      const ok = document.execCommand('copy')
      input.remove()
      return ok
    } catch {
      return false
    }
  }
}

export async function shareOrCopyUrl(
  url: string,
  title: string,
  onCopied?: () => void,
): Promise<'copied' | 'shared' | 'failed'> {
  const copied = await copyUrl(url)
  if (copied) onCopied?.()

  if (prefersNativeShare()) {
    try {
      await navigator.share({ title, url })
      return copied ? 'copied' : 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return copied ? 'copied' : 'shared'
      }
    }
  }

  return copied ? 'copied' : 'failed'
}

export function galleryPhotoPath(id: number) {
  return `/gallery/${id}`
}

export function galleryPhotoUrl(id: number) {
  return `${window.location.origin}${galleryPhotoPath(id)}`
}
