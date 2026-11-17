import { describe, expect, it } from 'vitest'
import { isValidBarcode, lookupOff, normalizeBarcode, offToDraft } from './off'

const SKYR = {
  product_name_fr: 'Skyr nature', brands: 'Jaouda, Groupe X', serving_quantity: '150',
  categories_tags: ['en:dairies', 'en:fermented-milk-products', 'en:yogurts'],
  nutriments: { 'energy-kcal_100g': 63, proteins_100g: 10.2, carbohydrates_100g: 4.1, fat_100g: 0.2 },
}

describe('codes-barres', () => {
  it('vérifie la clé de contrôle', () => {
    expect(isValidBarcode('3017620422003')).toBe(true) // EAN-13
    expect(isValidBarcode('3017620422004')).toBe(false)
    expect(isValidBarcode('96385074')).toBe(true) // EAN-8
    expect(isValidBarcode('036000291452')).toBe(true) // UPC-A
    expect(isValidBarcode('12345')).toBe(false)
    expect(normalizeBarcode('036000291452')).toBe('0036000291452')
  })
})

describe('Open Food Facts', () => {
  it('pré-remplit un aliment depuis la fiche', () => {
    const d = offToDraft('6111000000000', SKYR)
    expect(d.name).toBe('Skyr nature (Jaouda)')
    expect(d.category).toBe('laitier')
    expect(d).toMatchObject({ kcal: 63, protein: 10.2, carbs: 4.1, fat: 0.2, defaultPortionG: 150, verified: false, missing: [] })
  })

  it('convertit les kJ et signale les valeurs manquantes', () => {
    const d = offToDraft('1', { product_name: 'Pâtes', categories_tags: ['en:pastas'], nutriments: { 'energy-kj_100g': 1500, proteins_100g: 12 } })
    expect(d.kcal).toBe(359)
    expect(d.state).toBe('sec')
    expect(d.missing).toEqual(['carbs', 'fat'])
    expect(Number.isNaN(d.fat)).toBe(true)
  })

  it('distingue trouvé, introuvable et erreur', async () => {
    const ok = (body: unknown, status = 200) => (async () => new Response(JSON.stringify(body), { status })) as typeof fetch
    expect((await lookupOff('1', ok({ status: 1, product: SKYR }))).status).toBe('found')
    expect((await lookupOff('1', ok({ status: 0 }))).status).toBe('not-found')
    expect((await lookupOff('1', ok({}, 404))).status).toBe('not-found')
    expect((await lookupOff('1', ok({}, 503))).status).toBe('error')
    expect((await lookupOff('1', (async () => { throw new TypeError('net') }) as typeof fetch)).status).toBe('error')
  })
})
