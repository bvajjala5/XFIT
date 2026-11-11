// Vite emits the app stylesheet as a render-blocking <link>. The whole bundle
// is small and used by every route, so inlining it removes a blocking request
// on first paint. The hashed CSS file is kept in dist for the service worker.
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const dist = path.resolve('dist')
const htmlPath = path.join(dist, 'index.html')
let html = await readFile(htmlPath, 'utf8')

const linkPattern = /<link\s+rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g
const hrefs = [...html.matchAll(linkPattern)].map((match) => match[1])

for (const href of hrefs) {
  const css = await readFile(path.join(dist, href.replace(/^\//, '')), 'utf8')
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  html = html.replace(new RegExp(`<link\\s+rel="stylesheet"[^>]*href="${escaped}"[^>]*>`), `<style>${css}</style>`)
}

await writeFile(htmlPath, html)
console.log(`Inlined ${hrefs.length} stylesheet(s) into index.html`)
