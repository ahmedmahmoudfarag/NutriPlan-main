import { fetchMealsByCategory, fetchMealsByArea, fetchMealDetails } from "./api.js";
import { escapeHTML, showToast } from "./utils.js";
import { addFoodLogItem } from "./foodLog.js";
import { navigateTo, showGridMessage } from "./ui.js";

const DEFAULT_MEAL_IMAGE = "https://placehold.co/400x300?text=Recipe";

let allMeals = [];
let currentCategory = "";
let currentArea = "";
let isListView = false;

export function setMealsState(meals) {
  allMeals = meals;
}

export function getMealsState() {
  return allMeals;
}

export function setViewMode(listView) {
  isListView = listView;
  const gridBtn = document.getElementById("grid-view-btn");
  const listBtn = document.getElementById("list-view-btn");
  if (gridBtn && listBtn) {
    gridBtn.classList.toggle("bg-white", !isListView);
    gridBtn.classList.toggle("shadow-sm", !isListView);
    listBtn.classList.toggle("bg-white", isListView);
    listBtn.classList.toggle("shadow-sm", isListView);
  }
  renderMeals(allMeals);
}

export function renderCategories() {
  const categories = [
    { name: "Beef", icon: "fa-drumstick-bite", bg: "from-red-50 to-rose-50", border: "border-red-200 hover:border-red-400", from: "from-red-400", to: "to-rose-500" },
    { name: "Chicken", icon: "fa-drumstick-bite", bg: "from-amber-50 to-orange-50", border: "border-amber-200 hover:border-amber-400", from: "from-amber-400", to: "to-orange-500" },
    { name: "Dessert", icon: "fa-cake-candles", bg: "from-pink-50 to-rose-50", border: "border-pink-200 hover:border-pink-400", from: "from-pink-400", to: "to-rose-500" },
    { name: "Lamb", icon: "fa-drumstick-bite", bg: "from-orange-50 to-amber-50", border: "border-orange-200 hover:border-orange-400", from: "from-orange-400", to: "to-amber-500" },
    { name: "Pasta", icon: "fa-bowl-food", bg: "from-yellow-50 to-amber-50", border: "border-yellow-200 hover:border-yellow-400", from: "from-yellow-400", to: "to-amber-500" },
    { name: "Seafood", icon: "fa-fish", bg: "from-cyan-50 to-blue-50", border: "border-cyan-200 hover:border-cyan-400", from: "from-cyan-400", to: "to-blue-500" },
    { name: "Side", icon: "fa-plate-wheat", bg: "from-green-50 to-emerald-50", border: "border-green-200 hover:border-green-400", from: "from-green-400", to: "to-emerald-500" },
    { name: "Starter", icon: "fa-utensils", bg: "from-teal-50 to-cyan-50", border: "border-teal-200 hover:border-teal-400", from: "from-teal-400", to: "to-cyan-500" },
    { name: "Vegan", icon: "fa-leaf", bg: "from-emerald-50 to-green-50", border: "border-emerald-200 hover:border-emerald-400", from: "from-emerald-400", to: "to-green-500" },
    { name: "Vegetarian", icon: "fa-seedling", bg: "from-lime-50 to-green-50", border: "border-lime-200 hover:border-lime-400", from: "from-lime-400", to: "to-green-500" },
    { name: "Breakfast", icon: "fa-mug-hot", bg: "from-amber-50 to-orange-50", border: "border-amber-200 hover:border-amber-400", from: "from-amber-400", to: "to-orange-500" },
    { name: "Goat", icon: "fa-drumstick-bite", bg: "from-stone-50 to-amber-50", border: "border-stone-200 hover:border-stone-400", from: "from-stone-400", to: "to-amber-500" },
  ];

  const grid = document.getElementById("categories-grid");
  if (!grid) return;
  grid.innerHTML = categories
    .map(
      (c) => `
      <div class="category-card bg-gradient-to-br ${c.bg} rounded-xl p-3 border ${c.border} hover:shadow-md cursor-pointer transition-all group" data-category="${c.name}">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 bg-gradient-to-br ${c.from} ${c.to} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <i class="fa-solid ${c.icon} text-white text-sm"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-gray-900">${c.name}</h3>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

export function renderAreas() {
  const areas = [
    "",
    "American",
    "British",
    "Canadian",
    "Chinese",
    "Egyptian",
    "French",
    "Greek",
    "Indian",
    "Italian",
    "Japanese",
    "Mexican",
    "Moroccan",
    "Spanish",
    "Thai",
    "Turkish",
    "Vietnamese",
  ];

  const container = document.getElementById("areas-list");
  if (!container) return;
  container.innerHTML = areas
    .map(
      (area) =>
        `<button class="${area === "" ? "active" : ""}" data-area="${area}">${area || "All Cuisines"}</button>`
    )
    .join("");
}

export async function filterRecipes(type, value) {
  showGridMessage("recipes-grid", "Loading filtered recipes...");
  try {
    let results = [];
    if (type === "category") {
      currentCategory = value;
      currentArea = "";
      results = await fetchMealsByCategory(value);
      results = results.map((m) => ({ ...m, strCategory: value }));
    } else {
      currentArea = value;
      currentCategory = "";
      results = await fetchMealsByArea(value);
      results = results.map((m) => ({ ...m, strArea: value }));
    }
    renderMeals(results);
  } catch {
    showGridMessage("recipes-grid", "Could not load recipes for selected filter.");
  }
}

export function renderMeals(meals) {
  const countEl = document.getElementById("recipes-count");
  if (countEl) {
    countEl.textContent = `${meals.length} delicious recipe${meals.length === 1 ? "" : "s"} found`;
  }

  const grid = document.getElementById("recipes-grid");
  if (!grid) return;

  grid.classList.toggle("recipe-list", isListView);

  if (!meals || meals.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500">
      <i class="fa-solid fa-utensils text-4xl mb-3 text-gray-300"></i>
      <p class="text-lg font-medium">No recipes found.</p>
      <p class="text-sm text-gray-400">Try searching for another query or changing filters.</p>
    </div>`;
    return;
  }

  grid.innerHTML = meals
    .map((m) => {
      const category = m.strCategory || currentCategory || "Various";
      const area = m.strArea || currentArea || "International";
      const image = m.strMealThumb || DEFAULT_MEAL_IMAGE;

      return `
      <article class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-meal-id="${m.idMeal}">
        <div class="relative h-48 overflow-hidden">
          <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="${image}" alt="${escapeHTML(m.strMeal)}" onerror="this.onerror=null;this.src='${DEFAULT_MEAL_IMAGE}'" loading="lazy" />
          <div class="absolute bottom-3 left-3 flex gap-2">
            <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-lg text-gray-800 flex items-center gap-1">
              <i class="fa-solid fa-tag text-emerald-600"></i>${escapeHTML(category)}
            </span>
            <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-lg text-gray-800 flex items-center gap-1">
              <i class="fa-solid fa-globe text-blue-600"></i>${escapeHTML(area)}
            </span>
          </div>
        </div>
        <div class="p-4">
          <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">${escapeHTML(m.strMeal)}</h3>
          <p class="text-xs text-gray-600 mb-3 line-clamp-2">${escapeHTML(m.strInstructions ? m.strInstructions.substring(0, 100) + "..." : "Delicious recipe to try!")}</p>
          <div class="flex items-center justify-between text-xs">
            <span class="font-semibold text-gray-900"><i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>${escapeHTML(category)}</span>
            <span class="font-semibold text-gray-500"><i class="fa-solid fa-globe text-blue-500 mr-1"></i>${escapeHTML(area)}</span>
          </div>
        </div>
      </article>
    `;
    })
    .join("");
}

export async function openMealDetails(id) {
  const section = document.getElementById("meal-details");
  if (!section) return;

  section.innerHTML = `
    <div class="max-w-7xl mx-auto py-12 text-center text-gray-500">
      <i class="fa-solid fa-spinner animate-spin text-4xl text-emerald-600 mb-3"></i>
      <p class="text-lg">Loading recipe details...</p>
    </div>
  `;

  try {
    const m = await fetchMealDetails(id);
    if (!m) throw new Error("Meal not found");

    const ingredients = extractIngredients(m);
    const nutrition = calculateMealNutrition(ingredients.length);

    let videoEmbedHTML = "";
    if (m.strYoutube) {
      const videoId = m.strYoutube.includes("v=")
        ? m.strYoutube.split("v=")[1].split("&")[0]
        : m.strYoutube.split("/").pop();
      if (videoId) {
        videoEmbedHTML = `
          <div class="bg-white rounded-2xl shadow-lg p-6 mt-8">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fa-solid fa-video text-red-500"></i> Video Tutorial
            </h2>
            <div class="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
              <iframe src="https://www.youtube.com/embed/${videoId}" class="absolute inset-0 w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
          </div>
        `;
      }
    }

    section.innerHTML = `
      <div class="max-w-7xl mx-auto">
        <button id="back-to-meals-btn" class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium mb-6 transition-colors">
          <i class="fa-solid fa-arrow-left"></i>
          <span>Back to Recipes</span>
        </button>

        <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div class="relative h-80 md:h-96">
            <img src="${m.strMealThumb || DEFAULT_MEAL_IMAGE}" alt="${escapeHTML(m.strMeal)}" onerror="this.onerror=null;this.src='${DEFAULT_MEAL_IMAGE}'" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            <div class="absolute bottom-0 left-0 right-0 p-8">
              <div class="flex items-center gap-3 mb-3">
                <span class="px-3 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full">${escapeHTML(m.strCategory || "Recipe")}</span>
                <span class="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">${escapeHTML(m.strArea || "International")}</span>
              </div>
              <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">${escapeHTML(m.strMeal)}</h1>
              <div class="flex items-center gap-6 text-white/90">
                <span class="flex items-center gap-2"><i class="fa-solid fa-clock"></i><span>30 min</span></span>
                <span class="flex items-center gap-2"><i class="fa-solid fa-utensils"></i><span>4 servings</span></span>
                <span class="flex items-center gap-2"><i class="fa-solid fa-fire"></i><span>${nutrition.calories} cal/serving</span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-3 mb-8">
          <button id="log-meal-btn" data-meal-id="${m.idMeal}" class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg">
            <i class="fa-solid fa-clipboard-list"></i>
            <span>Log This Meal</span>
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-8">
            <div class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-list-check text-emerald-600"></i> Ingredients
                <span class="text-sm font-normal text-gray-500 ml-auto">${ingredients.length} items</span>
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${ingredients
                  .map(
                    (item) => `
                  <label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer group">
                    <input type="checkbox" onchange="this.nextElementSibling.classList.toggle('line-through', this.checked); this.nextElementSibling.classList.toggle('text-gray-400', this.checked)" class="ingredient-checkbox w-5 h-5 text-emerald-600 rounded border-gray-300 cursor-pointer" />
                    <span class="text-gray-700 group-hover:text-gray-900 transition-colors">${escapeHTML(item)}</span>
                  </label>
                `
                  )
                  .join("")}
              </div>
            </div>

            <div class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-shoe-prints text-emerald-600"></i> Instructions
              </h2>
              <div class="space-y-4">
                ${(m.strInstructions || "")
                  .split(/\r?\n/)
                  .filter((step) => step.trim())
                  .map(
                    (step, idx) => `
                  <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 text-sm">${idx + 1}</div>
                    <p class="text-gray-700 leading-relaxed pt-1">${escapeHTML(step)}</p>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>

            ${videoEmbedHTML}
          </div>

          <div class="space-y-6">
            <div class="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-chart-pie text-emerald-600"></i> Nutrition Facts
              </h2>
              <p class="text-sm text-gray-500 mb-4">Per serving (Estimated)</p>

              <div class="text-center py-4 mb-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
                <p class="text-sm text-gray-600">Calories per serving</p>
                <p class="text-4xl font-bold text-emerald-600">${nutrition.calories}</p>
                <p class="text-xs text-gray-500 mt-1">Total: ${nutrition.calories * 4} cal</p>
              </div>

              <div class="space-y-4">
                <div>
                  <div class="flex items-center justify-between text-sm mb-1">
                    <span class="font-medium text-gray-700">Protein</span>
                    <span class="font-bold text-gray-900">${nutrition.protein}g</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-2">
                    <div class="bg-emerald-500 h-2 rounded-full" style="width: ${Math.min(100, (nutrition.protein / 50) * 100)}%"></div>
                  </div>
                </div>
                <div>
                  <div class="flex items-center justify-between text-sm mb-1">
                    <span class="font-medium text-gray-700">Carbs</span>
                    <span class="font-bold text-gray-900">${nutrition.carbohydrates}g</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-2">
                    <div class="bg-blue-500 h-2 rounded-full" style="width: ${Math.min(100, (nutrition.carbohydrates / 250) * 100)}%"></div>
                  </div>
                </div>
                <div>
                  <div class="flex items-center justify-between text-sm mb-1">
                    <span class="font-medium text-gray-700">Fat</span>
                    <span class="font-bold text-gray-900">${nutrition.fats}g</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-2">
                    <div class="bg-purple-500 h-2 rounded-full" style="width: ${Math.min(100, (nutrition.fats / 65) * 100)}%"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("back-to-meals-btn")?.addEventListener("click", () => navigateTo("home"));
    document.getElementById("log-meal-btn")?.addEventListener("click", () => {
      addFoodLogItem({
        name: m.strMeal,
        image: m.strMealThumb,
        ...nutrition,
        type: "Meal",
      });
      showToast(`"${m.strMeal}" logged to today's Food Log!`);
    });
  } catch (err) {
    console.error(err);
    section.innerHTML = `
      <div class="max-w-7xl mx-auto py-16 text-center">
        <p class="text-xl text-red-500 font-bold mb-2">Could not load recipe details.</p>
        <button id="retry-meal-btn" class="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold">Back to Recipes</button>
      </div>
    `;
    document.getElementById("retry-meal-btn")?.addEventListener("click", () => navigateTo("home"));
  }
}

function extractIngredients(m) {
  const result = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = m[`strIngredient${i}`];
    const measure = m[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      result.push(`${measure ? measure.trim() : ""} ${ingredient.trim()}`.trim());
    }
  }
  return result;
}

function calculateMealNutrition(ingredientCount) {
  const count = ingredientCount || 6;
  return {
    calories: count * 55 + 120,
    protein: count * 3 + 8,
    carbohydrates: count * 6 + 12,
    fats: count * 2 + 5,
  };
}
