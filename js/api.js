const MEAL_API = "https://www.themealdb.com/api/json/v1/1";
const PRODUCT_API = "https://world.openfoodfacts.org/api/v2";
 
// fetch with timeout so a slow/blocked API never hangs the app
async function fetchJSON(url, ms = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
 
export async function fetchInitialMeals() {
  const data = await fetchJSON(`${MEAL_API}/search.php?s=chicken`);
  return (data.meals || []).slice(0, 25);
}
 
export async function searchMeals(query) {
  const data = await fetchJSON(`${MEAL_API}/search.php?s=${encodeURIComponent(query)}`);
  return data.meals || [];
}
 
export async function fetchMealsByCategory(category) {
  const data = await fetchJSON(`${MEAL_API}/filter.php?c=${encodeURIComponent(category)}`);
  return data.meals || [];
}
 
export async function fetchMealsByArea(area) {
  const data = await fetchJSON(`${MEAL_API}/filter.php?a=${encodeURIComponent(area)}`);
  return data.meals || [];
}
 
export async function fetchMealDetails(id) {
  const data = await fetchJSON(`${MEAL_API}/lookup.php?i=${encodeURIComponent(id)}`);
  return data.meals?.[0] || null;
}
 
export async function searchProducts(query) {
  const url = `${PRODUCT_API}/search?categories_tags_en=food&page_size=24&fields=code,product_name,brands,image_front_small_url,nutriments,nutrition_grades,quantity,nova_group&search_terms=${encodeURIComponent(query)}`;
  const data = await fetchJSON(url, 20000);
  return data.products || [];
}
 
export async function fetchProductByBarcode(barcode) {
  const url = `${PRODUCT_API}/product/${encodeURIComponent(barcode)}.json`;
  const data = await fetchJSON(url, 20000);
  return data.product ? [data.product] : [];
}