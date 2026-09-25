const MAX_CAPTION = 240

/** Caption stored in the original file (IPTC, XMP, or EXIF), before we re-encode the JPEG. */
export async function readEmbeddedImageCaption(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  return (
    readIptcCaption(bytes) ||
    readXmpDescription(bytes) ||
    readExifDescription(bytes) ||
    readPngTextCaption(bytes)
  )
}

export function captionForNewUpload(file: File, embedded: string, fallback = ''): string {
  const fromName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
  return (cleanCaption(embedded) || fromName || fallback).slice(0, MAX_CAPTION)
}

function cleanCaption(value: string): string {
  const text = decodeXml(value.replace(/\u0000/g, ' ')).replace(/\s+/g, ' ').trim()
  return text.slice(0, MAX_CAPTION)
}

function decodeXml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => codePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => codePoint(Number.parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function codePoint(code: number): string {
  return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : ''
}

function rawAscii(bytes: Uint8Array, start: number, length: number): string {
  return new TextDecoder('latin1').decode(bytes.subarray(start, start + length))
}

function asText(bytes: Uint8Array, start: number, length: number): string {
  return new TextDecoder('utf-8', { fatal: false })
    .decode(bytes.subarray(start, start + length))
    .replace(/\u0000+$/g, '')
}

function readXmpDescription(bytes: Uint8Array): string {
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  const block = text.match(/<dc:description\b[^>]*>([\s\S]*?)<\/dc:description>/i)?.[1]
  if (!block) return ''
  const item = block.match(/<rdf:li\b[^>]*>([\s\S]*?)<\/rdf:li>/i)?.[1] ?? block
  return cleanCaption(item.replace(/<[^>]+>/g, ''))
}

function readIptcCaption(bytes: Uint8Array): string {
  let offset = 2
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return ''
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) break
    const marker = bytes[offset + 1]
    if (marker === 0xda || marker === 0xd9) break
    const size = (bytes[offset + 2] << 8) | bytes[offset + 3]
    if (size < 2 || offset + 2 + size > bytes.length) break
    if (marker === 0xed) {
      const found = iptcCaptionInSegment(bytes.subarray(offset + 4, offset + 2 + size))
      if (found) return found
    }
    offset += 2 + size
  }
  return ''
}

function iptcCaptionInSegment(segment: Uint8Array): string {
  const header = 'Photoshop 3.0\0'
  if (rawAscii(segment, 0, header.length) !== header) return ''
  let offset = header.length
  while (offset + 8 <= segment.length) {
    if (
      segment[offset] !== 0x38 ||
      segment[offset + 1] !== 0x42 ||
      segment[offset + 2] !== 0x49 ||
      segment[offset + 3] !== 0x4d
    ) {
      break
    }
    const id = (segment[offset + 4] << 8) | segment[offset + 5]
    let nameLength = segment[offset + 6]
    let cursor = offset + 7 + nameLength
    if ((1 + nameLength) % 2 === 1) cursor += 1
    if (cursor + 4 > segment.length) break
    const dataSize =
      (segment[cursor] << 24) |
      (segment[cursor + 1] << 16) |
      (segment[cursor + 2] << 8) |
      segment[cursor + 3]
    cursor += 4
    if (dataSize < 0 || cursor + dataSize > segment.length) break
    if (id === 0x0404) {
      const caption = iptcCaptionInData(segment.subarray(cursor, cursor + dataSize))
      if (caption) return caption
    }
    cursor += dataSize + (dataSize % 2)
    offset = cursor
  }
  return ''
}

function iptcCaptionInData(data: Uint8Array): string {
  let offset = 0
  let utf8 = false
  let caption = ''
  while (offset + 5 <= data.length) {
    if (data[offset] !== 0x1c) break
    const record = data[offset + 1]
    const dataset = data[offset + 2]
    let length = (data[offset + 3] << 8) | data[offset + 4]
    offset += 5
    if (length >= 0x8000) {
      const extra = length & 0x7fff
      if (offset + extra > data.length) break
      length = 0
      for (let i = 0; i < extra; i += 1) length = (length << 8) | data[offset + i]
      offset += extra
    }
    if (offset + length > data.length) break
    if (record === 1 && dataset === 90) {
      utf8 =
        length >= 3 && data[offset] === 0x1b && data[offset + 1] === 0x25 && data[offset + 2] === 0x47
    }
    if (record === 2 && dataset === 120) {
      caption = utf8
        ? asText(data, offset, length)
        : new TextDecoder('latin1').decode(data.subarray(offset, offset + length))
    }
    offset += length
  }
  return cleanCaption(caption)
}

function readExifDescription(bytes: Uint8Array): string {
  let offset = 2
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return ''
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) break
    const marker = bytes[offset + 1]
    if (marker === 0xda || marker === 0xd9) break
    const size = (bytes[offset + 2] << 8) | bytes[offset + 3]
    if (size < 2 || offset + 2 + size > bytes.length) break
    if (marker === 0xe1) {
      const payload = bytes.subarray(offset + 4, offset + 2 + size)
      if (rawAscii(payload, 0, 6) === 'Exif\u0000\u0000') {
        const found = exifDescription(payload.subarray(6))
        if (found) return found
      }
    }
    offset += 2 + size
  }
  return ''
}

function exifDescription(tiff: Uint8Array): string {
  if (tiff.length < 8) return ''
  const little = tiff[0] === 0x49 && tiff[1] === 0x49
  const big = tiff[0] === 0x4d && tiff[1] === 0x4d
  if (!little && !big) return ''
  const u16 = (at: number) => {
    if (at + 2 > tiff.length) return 0
    return little ? tiff[at] | (tiff[at + 1] << 8) : (tiff[at] << 8) | tiff[at + 1]
  }
  const u32 = (at: number) => {
    if (at + 4 > tiff.length) return 0
    return little
      ? tiff[at] | (tiff[at + 1] << 8) | (tiff[at + 2] << 16) | (tiff[at + 3] << 24)
      : (tiff[at] << 24) | (tiff[at + 1] << 16) | (tiff[at + 2] << 8) | tiff[at + 3]
  }
  if (u16(2) !== 42) return ''
  let ifd = u32(4)
  const seen = new Set<number>()
  while (ifd && ifd + 2 <= tiff.length && !seen.has(ifd)) {
    seen.add(ifd)
    const count = u16(ifd)
    for (let i = 0; i < count; i += 1) {
      const entry = ifd + 2 + i * 12
      if (entry + 12 > tiff.length) break
      const tag = u16(entry)
      const type = u16(entry + 2)
      const components = u32(entry + 4)
      if (tag !== 0x010e && tag !== 0x9286) continue
      const byteLength = components * (type === 2 || type === 7 ? 1 : type === 3 ? 2 : 4)
      const valueAt = byteLength <= 4 ? entry + 8 : u32(entry + 8)
      if (valueAt < 0 || valueAt + byteLength > tiff.length) continue
      if (tag === 0x010e && type === 2) return cleanCaption(asText(tiff, valueAt, byteLength))
      if (tag === 0x9286 && type === 7 && byteLength > 8) {
        const charset = asText(tiff, valueAt, 8)
        const body = tiff.subarray(valueAt + 8, valueAt + byteLength)
        if (charset.startsWith('UNICODE')) {
          return cleanCaption(new TextDecoder('utf-16le').decode(body))
        }
        return cleanCaption(new TextDecoder('latin1').decode(body))
      }
    }
    ifd = u32(ifd + 2 + count * 12)
  }
  return ''
}

function readPngTextCaption(bytes: Uint8Array): string {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10]
  if (!sig.every((byte, index) => bytes[index] === byte)) return ''
  let offset = 8
  while (offset + 12 <= bytes.length) {
    const length = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]
    const type = asText(bytes, offset + 4, 4)
    const dataAt = offset + 8
    if (length < 0 || dataAt + length > bytes.length) break
    if (type === 'tEXt') {
      const raw = asText(bytes, dataAt, length)
      const split = raw.indexOf('\u0000')
      const key = split >= 0 ? raw.slice(0, split) : raw
      const value = split >= 0 ? raw.slice(split + 1) : ''
      if (/^(description|caption|comment|title)$/i.test(key)) return cleanCaption(value)
    }
    offset = dataAt + length + 4
  }
  return ''
}
