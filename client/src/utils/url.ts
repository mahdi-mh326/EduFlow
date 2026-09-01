/** Returns a safe external URL, or null for untrusted/non-web schemes. */
export function getSafeExternalUrl(value: string | undefined | null): string | null {
  if (!value) return null

  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}
