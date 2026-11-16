// Generates the Uttar Fitness admin app icon and brand mark.
//
// The main app's icon is the white Uttar emblem on a black tile. The standalone
// admin app deliberately inverts that — a black emblem on a white tile — so the
// two are easy to tell apart in the dock / taskbar.
//
// Source of truth is the same white-on-transparent emblem the web app masks
// with (public/icons/emblem-white.png), so the mark stays in sync.
//
// Run from the repo root:  node scripts/make-admin-icon.mjs
import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const emblemSrc = path.join(root, 'public/icons/emblem-white.png')

const out = {
  transparentMark: path.join(root, 'admin-desktop/src/assets/emblem-black.png'),
  appIcon1024: path.join(root, 'admin-desktop/build/icon.png'),
  runtimeIcon512: path.join(root, 'admin-desktop/electron/icon.png'),
}

/** Recolour the white emblem to solid black, keeping its alpha channel. */
async function blackEmblem() {
  const { data, info } = await sharp(emblemSrc).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const px = info.width * info.height
  const buffer = Buffer.alloc(px * 4)
  for (let i = 0; i < px; i += 1) {
    // RGB stays 0 (black); only the original alpha is carried over.
    buffer[i * 4 + 3] = data[i * 4 + 3]
  }
  return sharp(buffer, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer()
}

/** White square tile with the black emblem centred, artwork at ~68% width. */
async function tile(markPng, size, dest) {
  const mark = await sharp(markPng).resize({ width: Math.round(size * 0.68) }).png().toBuffer()
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(dest)
}

async function main() {
  await mkdir(path.dirname(out.transparentMark), { recursive: true })
  await mkdir(path.dirname(out.appIcon1024), { recursive: true })

  const mark = await blackEmblem()
  await sharp(mark).toFile(out.transparentMark)
  await tile(mark, 1024, out.appIcon1024)
  await tile(mark, 512, out.runtimeIcon512)

  console.log('Wrote:')
  for (const dest of Object.values(out)) console.log('  ' + path.relative(root, dest))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
