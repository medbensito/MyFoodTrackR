import { BarcodeDetector, prepareZXingModule } from 'barcode-detector/ponyfill'
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'

/** Formats des produits alimentaires. */
const FORMATS = ['ean_13', 'ean_8', 'upc_a'] as const

type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> }
type NativeCtor = {
  new (o: { formats: string[] }): Detector
  getSupportedFormats: () => Promise<string[]>
}

let detector: Promise<Detector> | null = null

/**
 * Décodeur natif quand le navigateur en a un (Chrome Android), sinon ZXing en WebAssembly
 * (Safari iOS). Le .wasm est servi par l'app et mis en cache hors ligne : aucun CDN.
 */
export function getDetector(): Promise<Detector> {
  detector ??= (async () => {
    const Native = (globalThis as { BarcodeDetector?: NativeCtor }).BarcodeDetector
    if (Native) {
      try {
        const supported = await Native.getSupportedFormats()
        if (supported.includes('ean_13')) return new Native({ formats: FORMATS.filter((f) => supported.includes(f)) })
      } catch { /* repli sur ZXing */ }
    }
    await prepareZXingModule({
      overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) },
      fireImmediately: true,
    })
    return new BarcodeDetector({ formats: [...FORMATS] }) as unknown as Detector
  })()
  detector.catch(() => { detector = null })
  return detector
}
