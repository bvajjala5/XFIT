// Open Food Facts barcode lookup. The network call stays out of the scanner
// component so the mapping logic can be unit-tested without a camera.

const PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product'
const FIELDS = 'product_name,brands,nutriments,serving_size,serving_quantity,code'

const num = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}
const round1 = (n) => Math.round(n * 10) / 10

/** Convert an Open Food Facts product into the food shape used across the app. */
export function productToFood(product, code) {
  if (!product || typeof product !== 'object') return null
  const name = String(product.product_name || '').trim()
  if (!name) return null

  const nutriments = product.nutriments || {}
  // Some regions only publish kilojoules.
  let calories = num(nutriments['energy-kcal_100g'])
  if (calories <= 0 && num(nutriments['energy-kj_100g']) > 0) {
    calories = num(nutriments['energy-kj_100g']) / 4.184
  }
  calories = Math.round(calories)
  if (calories <= 0) return null

  const servingGrams = Math.round(num(product.serving_quantity))
  const servingLabel = String(product.serving_size || '').trim()
  const servings = servingGrams > 0
    ? [[servingLabel || '1 serving', servingGrams]]
    : []

  return {
    id: `off-${code}`,
    name,
    brand: String(product.brands || '').split(',')[0].trim(),
    source: 'online',
    servings,
    servingGrams: servingGrams > 0 ? servingGrams : undefined,
    per100: {
      calories,
      protein: round1(num(nutriments.proteins_100g)),
      carbs: round1(num(nutriments.carbohydrates_100g)),
      fat: round1(num(nutriments.fat_100g)),
    },
  }
}

/** Look a barcode up in Open Food Facts. Returns null when the product is unknown. */
export async function lookupBarcode(rawCode, { fetchImpl = fetch, signal } = {}) {
  const code = String(rawCode || '').replace(/\D/g, '')
  if (code.length < 6) return null

  const res = await fetchImpl(`${PRODUCT_URL}/${encodeURIComponent(code)}.json?fields=${FIELDS}`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Barcode lookup failed (${res.status})`)

  const data = await res.json().catch(() => null)
  if (!data || data.status === 0 || !data.product) return null
  return productToFood(data.product, code)
}
