// Generates responsive WebP variants of the landing hero posters. The originals
// stay as the JPEG fallback for older browsers; the app serves the WebP via
// <picture> with srcset so phones download the smallest usable file.
//
// Run with: npm run optimize:images
import path from 'node:path'
import sharp from 'sharp'

const publicDir = path.resolve('public')
const sources = ['hero-sunrise.jpg', 'hero-midnight.jpg']
const widths = [480, 640, 820]

for (const src of sources) {
  const base = src.replace(/\.jpg$/, '')
  const input = path.join(publicDir, src)
  for (const width of widths) {
    const out = path.join(publicDir, `${base}-${width}.webp`)
    const info = await sharp(input)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 76, effort: 6 })
      .toFile(out)
    console.log(`${path.basename(out).padEnd(28)} ${(info.size / 1024).toFixed(1).padStart(6)} KiB  ${info.width}x${info.height}`)
  }
}
