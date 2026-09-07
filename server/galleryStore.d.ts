export const GALLERY_BLOB_PATH: string
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
export function readGalleryFromBlob(
  env: Record<string, string | undefined>,
): Promise<GalleryRecord[] | null>
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
