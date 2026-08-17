/** Safari (macOS + iOS), excluding Chrome/Firefox on those platforms. */
export function isSafariBrowser() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/CriOS|FxiOS|EdgiOS|Chrome|Chromium|Android/i.test(ua)) return false
  return /Safari/i.test(ua) || navigator.vendor === 'Apple Computer, Inc.'
}

export function applySafariClass() {
  if (isSafariBrowser()) {
    document.documentElement.classList.add('is-safari')
  }
}
