import { searchProducts as fetchSearchProducts, fetchProductByBarcode } from "./api.js";
import { escapeHTML, showToast, setButtonLoading } from "./utils.js";
import { addFoodLogItem } from "./foodLog.js";
import { showGridMessage } from "./ui.js";

const DEFAULT_PRODUCT_IMAGE = "https://placehold.co/300x200?text=Product";

let loadedProducts = [];

export async function searchProducts(isBarcode = false) {
  const input = document.getElementById(isBarcode ? "barcode-input" : "product-search-input");
  const btn = document.getElementById(isBarcode ? "lookup-barcode-btn" : "search-product-btn");
  const query = input ? input.value.trim() : "";

  if (!query) return;

  setButtonLoading(btn, true, isBarcode ? '<i class="fa-solid fa-search mr-2"></i>Lookup' : "Search");
  showGridMessage("products-grid", "Searching products database...");

  try {
    const results = isBarcode
      ? await fetchProductByBarcode(query)
      : await fetchSearchProducts(query);
    loadedProducts = results;

    if (results.length === 0 && isBarcode) {
      showGridMessage("products-grid", `No product found for barcode: "${escapeHTML(query)}".`);
      showToast(`No product found for barcode ${query}`, "error");
    } else {
      renderProducts(loadedProducts);
    }
  } catch {
    showGridMessage("products-grid", "Product search failed. Check your connection or query.");
    showToast("Product search failed.", "error");
  } finally {
    setButtonLoading(btn, false, isBarcode ? '<i class="fa-solid fa-search mr-2"></i>Lookup' : "Search");
  }
}

export function filterProductsByGrade(grade) {
  document.querySelectorAll("[data-grade]").forEach((btn) => {
    const isMatch = btn.dataset.grade === grade;
    btn.classList.toggle("ring-2", isMatch);
    btn.classList.toggle("ring-emerald-500", isMatch);
  });

  const filtered = grade
    ? loadedProducts.filter(
        (p) => (p.nutrition_grades || p.nutriscore_grade || "").toLowerCase() === grade.toLowerCase()
      )
    : loadedProducts;

  renderProducts(filtered);
}

export function renderProducts(products = loadedProducts) {
  const countEl = document.getElementById("products-count");
  if (countEl) {
    countEl.textContent = products.length
      ? `${products.length} product${products.length === 1 ? "" : "s"} found`
      : "Search for products to see results";
  }

  const grid = document.getElementById("products-grid");
  if (!grid) return;

  if (!products || products.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-20 text-gray-500">
        <div class="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
          <i class="fa-solid fa-box-open text-3xl"></i>
        </div>
        <p class="text-lg font-medium text-gray-700">No products to display</p>
        <p class="text-sm text-gray-400 mt-1">Search for a packaged food by name, barcode, or category pill.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products
    .map((p) => {
      const item = {
        name: p.product_name || "Packaged Product",
        brand: p.brands || "Generic Brand",
        image: p.image_front_small_url || DEFAULT_PRODUCT_IMAGE,
        barcode: p.code || "",
        calories: Math.round(p.nutriments?.["energy-kcal_100g"] || p.nutriments?.["energy-kcal"] || 150),
        protein: Math.round(p.nutriments?.proteins_100g || 5),
        carbohydrates: Math.round(p.nutriments?.carbohydrates_100g || 20),
        fats: Math.round(p.nutriments?.fat_100g || 4),
        grade: (p.nutrition_grades || p.nutriscore_grade || "N/A").toUpperCase(),
        nova: p.nova_group || 2,
        quantity: p.quantity || "100g",
        type: "Product",
      };

      const scoreColor =
        item.grade === "A"
          ? "bg-green-500"
          : item.grade === "B"
          ? "bg-lime-500"
          : item.grade === "C"
          ? "bg-yellow-500"
          : item.grade === "D"
          ? "bg-orange-500"
          : item.grade === "E"
          ? "bg-red-500"
          : "bg-gray-400";

      return `
      <article class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col" data-barcode="${item.barcode}">
        <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
          <img class="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300" src="${item.image}" alt="${escapeHTML(item.name)}" onerror="this.onerror=null;this.src='${DEFAULT_PRODUCT_IMAGE}'" loading="lazy" />
          <div class="absolute top-2 left-2 ${scoreColor} text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            Nutri-Score ${item.grade}
          </div>
          <div class="absolute top-2 right-2 bg-slate-800 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center" title="NOVA Group ${item.nova}">
            ${item.nova}
          </div>
        </div>

        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${escapeHTML(item.brand)}</p>
            <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">${escapeHTML(item.name)}</h3>

            <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
              <span><i class="fa-solid fa-weight-scale mr-1"></i>${escapeHTML(item.quantity)}</span>
              <span><i class="fa-solid fa-fire mr-1"></i>${item.calories} kcal/100g</span>
            </div>
          </div>

          <div>
            <div class="grid grid-cols-4 gap-1 text-center mb-3">
              <div class="bg-emerald-50 rounded p-1.5">
                <p class="text-xs font-bold text-emerald-700">${item.protein}g</p>
                <p class="text-[9px] text-gray-500">Protein</p>
              </div>
              <div class="bg-blue-50 rounded p-1.5">
                <p class="text-xs font-bold text-blue-700">${item.carbohydrates}g</p>
                <p class="text-[9px] text-gray-500">Carbs</p>
              </div>
              <div class="bg-purple-50 rounded p-1.5">
                <p class="text-xs font-bold text-purple-700">${item.fats}g</p>
                <p class="text-[9px] text-gray-500">Fat</p>
              </div>
              <div class="bg-orange-50 rounded p-1.5">
                <p class="text-xs font-bold text-orange-700">${item.calories}</p>
                <p class="text-[9px] text-gray-500">Kcal</p>
              </div>
            </div>

            <button data-product="${encodeURIComponent(JSON.stringify(item))}" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 text-sm font-semibold transition-colors">
              <i class="fa-solid fa-plus mr-1"></i>Add to Food Log
            </button>
          </div>
        </div>
      </article>
    `;
    })
    .join("");
}
