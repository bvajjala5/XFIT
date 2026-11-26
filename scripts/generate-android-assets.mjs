// Regenerate the native launcher and splash assets from the web app icon.
// Capacitor's copy step replaces these files on every `cap sync`, so this runs
// after sync to keep the installed app visually identical to the website.
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const source = path.join(root, 'public/icons/icon-512.png')
const res = path.join(root, 'android/app/src/main/res')

const densities = [
  { name: 'mdpi', launcher: 48, foreground: 108 },
  { name: 'hdpi', launcher: 72, foreground: 162 },
  { name: 'xhdpi', launcher: 96, foreground: 216 },
  { name: 'xxhdpi', launcher: 144, foreground: 324 },
  { name: 'xxxhdpi', launcher: 192, foreground: 432 },
]

const splashSizes = [
  ['drawable', 480, 320],
  ['drawable-land-mdpi', 480, 320],
  ['drawable-land-hdpi', 800, 480],
  ['drawable-land-xhdpi', 1280, 720],
  ['drawable-land-xxhdpi', 1600, 960],
  ['drawable-land-xxxhdpi', 1920, 1280],
  ['drawable-port-mdpi', 320, 480],
  ['drawable-port-hdpi', 480, 800],
  ['drawable-port-xhdpi', 720, 1280],
  ['drawable-port-xxhdpi', 960, 1600],
  ['drawable-port-xxxhdpi', 1280, 1920],
]

const iconBuffer = await fs.readFile(source)

async function write(target, data) {
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, data)
}

async function makeLauncherIcons() {
  for (const { name, launcher, foreground } of densities) {
    const dir = path.join(res, `mipmap-${name}`)

    await write(
      path.join(dir, 'ic_launcher.png'),
      await sharp(iconBuffer).resize(launcher, launcher).png().toBuffer(),
    )

    const circle = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${launcher}" height="${launcher}">` +
      `<circle cx="${launcher / 2}" cy="${launcher / 2}" r="${launcher / 2}" fill="white"/></svg>`,
    )
    await write(
      path.join(dir, 'ic_launcher_round.png'),
      await sharp(iconBuffer)
        .resize(launcher, launcher)
        .composite([{ input: circle, blend: 'dest-in' }])
        .png()
        .toBuffer(),
    )

    // Adaptive icons are masked to a circle/rounded square. Keep the mark
    // inside the safe zone by insetting the full-bleed web icon.
    const inner = Math.round(foreground * 0.8)
    const inset = Math.round((foreground - inner) / 2)
    const mark = await sharp(iconBuffer).resize(inner, inner).png().toBuffer()
    await write(
      path.join(dir, 'ic_launcher_foreground.png'),
      await sharp({
        create: {
          width: foreground,
          height: foreground,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([{ input: mark, left: inset, top: inset }])
        .png()
        .toBuffer(),
    )
  }

  // The icon's own background is black; match it behind the adaptive art.
  await write(
    path.join(res, 'values/ic_launcher_background.xml'),
    '<?xml version="1.0" encoding="utf-8"?>\n' +
      '<resources>\n' +
      '    <color name="ic_launcher_background">#000000</color>\n' +
      '</resources>\n',
  )
}

async function makeSplashScreens() {
  for (const [dirName, width, height] of splashSizes) {
    const markSize = Math.round(Math.min(width, height) * 0.5)
    const mark = await sharp(iconBuffer).resize(markSize, markSize).png().toBuffer()
    await write(
      path.join(res, dirName, 'splash.png'),
      await sharp({ create: { width, height, channels: 3, background: '#000000' } })
        .composite([{
          input: mark,
          left: Math.round((width - markSize) / 2),
          top: Math.round((height - markSize) / 2),
        }])
        .png()
        .toBuffer(),
    )
  }
}

await makeLauncherIcons()
await makeSplashScreens()
console.log('Generated Android launcher and splash assets from public/icons/icon-512.png')
