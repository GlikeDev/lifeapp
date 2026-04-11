// OpenFoodFacts API — поиск продуктов по штрих-коду и названию

export interface OFFProduct {
  barcode: string;
  name: string;
  brand: string;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  fat_per_100g: number | null;
  carbs_per_100g: number | null;
  image_url: string | null;
}

const HEADERS = { 'User-Agent': 'SaveSmart/1.0 (contact@savesmart.app)' };
const TIMEOUT_MS = 8000;

// ─── Fetch with timeout ───────────────────────────────────────────────────────
async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { headers: HEADERS, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Normalise barcode: UPC-A (12 digits) → EAN-13 (pad with leading zero) ──
function normaliseBarcode(barcode: string): string {
  const digits = barcode.replace(/\D/g, '');
  if (digits.length === 12) return '0' + digits;
  return digits;
}

// ─── Barcode lookup ───────────────────────────────────────────────────────────
// Tries v2 → v0 → search fallback for maximum coverage
export async function fetchProductByBarcode(rawBarcode: string): Promise<OFFProduct | null> {
  const barcode = normaliseBarcode(rawBarcode);

  // 1️⃣ Try v2 API
  try {
    const res = await fetchWithTimeout(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,brands,nutriments,image_front_url`
    );
    const json = await res.json();
    if (json.status === 1 && json.product) {
      return parseOFFProduct(barcode, json.product);
    }
  } catch (_) { /* fall through */ }

  // 2️⃣ Fallback: v0 API
  try {
    const res = await fetchWithTimeout(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const json = await res.json();
    if (json.status === 1 && json.product) {
      return parseOFFProduct(barcode, json.product);
    }
  } catch (_) { /* fall through */ }

  // 3️⃣ Fallback: search by barcode as a text query
  try {
    const results = await searchProductsByName(barcode);
    if (results.length > 0) return results[0];
  } catch (_) { /* fall through */ }

  return null;
}

// ─── Text search ──────────────────────────────────────────────────────────────
export async function searchProductsByName(query: string): Promise<OFFProduct[]> {
  try {
    const res = await fetchWithTimeout(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8&fields=code,product_name,brands,nutriments,image_front_url`
    );
    const json = await res.json();
    if (!json.products) return [];
    return json.products
      .filter((p: any) => p.product_name)
      .map((p: any) => parseOFFProduct(p.code ?? '', p));
  } catch {
    return [];
  }
}

// ─── Parser ───────────────────────────────────────────────────────────────────
function parseOFFProduct(barcode: string, p: any): OFFProduct {
  const n = p.nutriments ?? {};

  // energy-kcal_100g is kcal directly; energy_100g is kJ → convert
  let calories: number | null = null;
  if (n['energy-kcal_100g'] != null) {
    calories = Math.round(n['energy-kcal_100g']);
  } else if (n['energy_100g'] != null) {
    calories = Math.round(n['energy_100g'] / 4.184);
  }

  return {
    barcode,
    name: p.product_name ?? 'Неизвестный продукт',
    brand: p.brands ?? '',
    calories_per_100g: calories,
    protein_per_100g: n.proteins_100g ?? null,
    fat_per_100g: n.fat_100g ?? null,
    carbs_per_100g: n.carbohydrates_100g ?? null,
    image_url: p.image_front_url ?? null,
  };
}
