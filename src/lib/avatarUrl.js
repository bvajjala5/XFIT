// Google returns profile photos at a small fixed size (commonly `=s96-c`).
// Rendering that into a 80px circle on a high-DPI screen looks soft. Ask Google
// for a larger version of the same image; leave other hosts exactly as-is.
export function avatarImageUrl(url, size = 400) {
  if (typeof url !== 'string' || !url) return ''
  if (!/googleusercontent\.com/i.test(url)) return url
  const pixels = Math.max(1, Math.floor(Number(size) || 400))
  return url.replace(/=s\d+/i, `=s${pixels}`)
}
