export const GALLERY_BLOB_PATH: string
export const ARTIST_ORDER_BLOB_PATH: string
export const GALLERY_BACKUP_LATEST: string
export const GALLERY_BACKUP_PRESERVED: string
export const ARTIST_SLUG_RE: RegExp
export const MAX_GALLERY_JSON_BYTES: number
export const MAX_GALLERY_UPLOAD_BYTES: number
export const MAX_DECODED_IMAGE_BYTES: number
export const BLOB_NOT_CONFIGURED: string

export type GalleryRecord = {
  id: number
  src: string
  alt: string
  caption?: string
  category: string
  tags: string[]
  year?: number
  width: number
  height: number
  focalX?: number
  focalY?: number
  teaser?: boolean
}

export function adminPasswordFromEnv(
  env: Record<string, string | undefined>,
): string
export function isAdminAuthorized(
  given: string,
  env: Record<string, string | undefined>,
): boolean
export function blobTokenFromEnv(
  env: Record<string, string | undefined>,
): string
export function blobConfiguredFromEnv(
  env: Record<string, string | undefined>,
): boolean
export function nextGalleryId(items: Array<{ id?: unknown }>): number
export function sanitizeGalleryItem(raw: unknown): GalleryRecord | null
export function sanitizeGalleryItems(raw: unknown): GalleryRecord[] | null
export function sanitizeArtistOrder(raw: unknown): Record<string, number[]>
export function parseArtistOrderPutBody(
  raw: string,
):
  | { slug: string; ids: number[] }
  | { artistOrder: Record<string, number[]> }
  | { error: string }
export function mergeArtistOrderMap(
  current: unknown,
  slug: string,
  ids: number[],
): Record<string, number[]>
export function parseGalleryPutBody(
  raw: string,
): { items: GalleryRecord[] } | { error: string }
export function parseGalleryUploadBody(raw: string):
  | {
      id?: number
      filename: string
      contentType: string
      data: string
      width: number
      height: number
    }
  | { error: string }
export function decodeImageData(data: string): Buffer
export function loadBundledGalleryItems(): GalleryRecord[] | null
export function readGalleryFromBlob(
  env: Record<string, string | undefined>,
): Promise<GalleryRecord[] | null>
export function writeGalleryBackupToBlob(
  items: GalleryRecord[],
  env: Record<string, string | undefined>,
  note?: string,
): Promise<void>
export function ensurePreservedGalleryBackup(
  items: GalleryRecord[],
  env: Record<string, string | undefined>,
): Promise<{ skipped: true } | { wrote: true; preservedUrl: string } | { wrote: false; exists: true }>
export function readArtistOrderFromBlob(
  env: Record<string, string | undefined>,
): Promise<Record<string, number[]>>
export function writeArtistOrderToBlob(
  order: Record<string, number[]>,
  env: Record<string, string | undefined>,
): Promise<void>
export function writeArtistOrderSlugToBlob(
  slug: string,
  ids: number[],
  env: Record<string, string | undefined>,
): Promise<Record<string, number[]>>
export function writeGalleryToBlob(
  items: GalleryRecord[],
  env: Record<string, string | undefined>,
): Promise<void>
export function uploadImageToBlob(args: {
  buffer: Buffer
  contentType: string
  filename: string
  env: Record<string, string | undefined>
}): Promise<{ src: string }>
