import test from 'node:test'
import assert from 'node:assert/strict'
import { productToFood } from './barcode.js'

test('maps an Open Food Facts product to the app food shape', () => {
  const food = productToFood({
    product_name: 'Crunchy Peanut Butter',
    brands: 'Uttar Foods, Another Brand',
    serving_quantity: '32',
    serving_size: '2 tbsp (32 g)',
    nutriments: {
      'energy-kcal_100g': 588,
      proteins_100g: 25.1,
      carbohydrates_100g: 20,
      fat_100g: 50.39,
    },
  }, '12345678')

  assert.equal(food.id, 'off-12345678')
  assert.equal(food.name, 'Crunchy Peanut Butter')
  assert.equal(food.brand, 'Uttar Foods')
  assert.equal(food.source, 'online')
  assert.equal(food.per100.calories, 588)
  assert.equal(food.per100.protein, 25.1)
  assert.equal(food.per100.fat, 50.4)
  assert.equal(food.servingGrams, 32)
  assert.deepEqual(food.servings, [['2 tbsp (32 g)', 32]])
})

test('falls back to kilojoules when kilocalories are missing', () => {
  const food = productToFood({
    product_name: 'Oat Drink',
    nutriments: { 'energy-kj_100g': 184, proteins_100g: 0.3 },
  }, '999')
  assert.equal(food.per100.calories, 44)
})

test('rejects products without a name or usable energy', () => {
  assert.equal(productToFood({ nutriments: { 'energy-kcal_100g': 200 } }, '1'), null)
  assert.equal(productToFood({ product_name: 'Water', nutriments: {} }, '2'), null)
  assert.equal(productToFood(null, '3'), null)
})
