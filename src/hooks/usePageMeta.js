import { useEffect } from 'react'

export const SITE_URL = 'https://xfit-bpe.pages.dev'

const SELECTORS = {
  title: null,
  description: 'meta[name="description"]',
  canonical: 'link[rel="canonical"]',
  ogTitle: 'meta[property="og:title"]',
  ogDescription: 'meta[property="og:description"]',
  ogUrl: 'meta[property="og:url"]',
}

/**
 * Override the document title, description, canonical, and Open Graph tags for
 * a public marketing route. index.html ships the app-wide values, which are
 * restored when the visitor leaves the page (for example after signing in).
 */
export default function usePageMeta({ title, description, path = '/' }) {
  useEffect(() => {
    const url = SITE_URL + path
    const previous = {
      title: document.title,
      description: null,
      canonical: null,
      ogTitle: null,
      ogDescription: null,
      ogUrl: null,
    }
    const nodes = {}
    for (const [key, selector] of Object.entries(SELECTORS)) {
      if (!selector) continue
      const node = document.querySelector(selector)
      nodes[key] = node
      previous[key] = node?.getAttribute('content') ?? node?.getAttribute('href') ?? null
    }

    if (title) document.title = title
    if (description && nodes.description) nodes.description.setAttribute('content', description)
    if (title && nodes.ogTitle) nodes.ogTitle.setAttribute('content', title)
    if (description && nodes.ogDescription) nodes.ogDescription.setAttribute('content', description)
    if (nodes.ogUrl) nodes.ogUrl.setAttribute('content', url)
    if (nodes.canonical) nodes.canonical.setAttribute('href', url)

    return () => {
      document.title = previous.title
      for (const [key, node] of Object.entries(nodes)) {
        if (!node || previous[key] == null) continue
        const attr = key === 'canonical' ? 'href' : 'content'
        node.setAttribute(attr, previous[key])
      }
    }
  }, [title, description, path])
}
