import { fetchInitialMeals, searchMeals } from "./api.js";
import {
  renderCategories,
  renderAreas,
  renderMeals,
  filterRecipes,
  setViewMode,
  setMealsState,
  getMealsState,
} from "./recipes.js";
import { searchProducts, filterProductsByGrade } from "./products.js";
import {
  renderFoodLog,
  removeFoodLogItem,
  confirmClearLog,
  openCustomFoodModal,
  addFoodLogItem,
} from "./foodLog.js";
import {
  handleRoute,
  navigateTo,
  openSidebar,
  closeSidebar,
  showGridMessage,
} from "./ui.js";
import { showToast } from "./utils.js";
 
let searchTimeout = null;
 
function setupEventListeners() {
  window.addEventListener("popstate", handleRoute);
  window.addEventListener("hashchange", handleRoute);
 
  // Navigation Links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const text = link.textContent.toLowerCase();
      if (text.includes("scanner")) navigateTo("scanner");
      else if (text.includes("food log")) navigateTo("foodlog");
      else navigateTo("home");
      closeSidebar();
    });
  });
 
  // Sidebar Controls
  document.getElementById("header-menu-btn")?.addEventListener("click", openSidebar);
  document.getElementById("sidebar-close-btn")?.addEventListener("click", closeSidebar);
  document.getElementById("sidebar-overlay")?.addEventListener("click", closeSidebar);
 
  // Recipe Live Search Input
  const searchInput = document.getElementById("search-input");
  searchInput?.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);
 
    searchTimeout = setTimeout(async () => {
      const allMeals = getMealsState();
      if (!query) {
        renderMeals(allMeals);
        return;
      }
 
      const localMatches = allMeals.filter((m) =>
        m.strMeal.toLowerCase().includes(query.toLowerCase())
      );
 
      if (localMatches.length > 0) {
        renderMeals(localMatches);
      } else {
        showGridMessage("recipes-grid", "Searching recipes online...");
        try {
          const apiMeals = await searchMeals(query);
          renderMeals(apiMeals);
        } catch {
          showGridMessage("recipes-grid", "Failed to load search results.");
        }
      }
    }, 300);
  });
 
  // Recipe Category Cards Click
  document.getElementById("categories-grid")?.addEventListener("click", (e) => {
    const card = e.target.closest("[data-category]");
    if (!card) return;
    const cat = card.dataset.category;
    document.querySelectorAll(".category-card").forEach((c) =>
      c.classList.toggle("active", c.dataset.category === cat)
    );
    filterRecipes("category", cat);
  });
 
  // Recipe Area Filters Click
  document.getElementById("areas-list")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-area]");
    if (!btn) return;
    const area = btn.dataset.area;
    document.querySelectorAll("[data-area]").forEach((b) =>
      b.classList.toggle("active", b === btn)
    );
    area ? filterRecipes("area", area) : renderMeals(getMealsState());
  });
 
  // Recipe Details Navigation Click
  document.getElementById("recipes-grid")?.addEventListener("click", (e) => {
    const card = e.target.closest("[data-meal-id]");
    if (card) navigateTo(`meal/${card.dataset.mealId}`);
  });
 
  // Grid / List View Toggle
  document.getElementById("grid-view-btn")?.addEventListener("click", () => setViewMode(false));
  document.getElementById("list-view-btn")?.addEventListener("click", () => setViewMode(true));
 
  // Product Scanner Actions
  document.getElementById("search-product-btn")?.addEventListener("click", () => searchProducts(false));
  document.getElementById("lookup-barcode-btn")?.addEventListener("click", () => searchProducts(true));
 
  document.getElementById("product-search-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchProducts(false);
  });
  document.getElementById("barcode-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchProducts(true);
  });
 
  // Product Category Pills
  document.getElementById("product-categories")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".product-category-btn");
    if (!btn) return;
    const categoryName = btn.textContent.trim();
    const input = document.getElementById("product-search-input");
    if (input) input.value = categoryName;
    searchProducts(false);
  });
 
  // Product Card Add Delegate
  document.getElementById("products-grid")?.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-product]");
    if (addBtn) {
      const product = JSON.parse(decodeURIComponent(addBtn.dataset.product));
      addFoodLogItem(product);
      showToast(`"${product.name}" added to today's Food Log!`);
      return;
    }
    const barcodeCard = e.target.closest("[data-barcode]");
    if (barcodeCard && !e.target.closest("button")) {
      const barcode = barcodeCard.dataset.barcode;
      const input = document.getElementById("barcode-input");
      if (input) input.value = barcode;
      searchProducts(true);
    }
  });
 
  // Nutri-Score Filter Buttons
  document.querySelectorAll("[data-grade]").forEach((btn) => {
    btn.addEventListener("click", () => filterProductsByGrade(btn.dataset.grade));
  });
 
  // Food Log Section Delegations
  document.getElementById("foodlog-section")?.addEventListener("click", (e) => {
    const removeBtn = e.target.closest("[data-remove]");
    if (removeBtn) {
      removeFoodLogItem(removeBtn.dataset.remove);
      renderFoodLog();
      showToast("Item removed from Food Log.");
      return;
    }
    if (e.target.closest("#clear-foodlog")) {
      confirmClearLog();
      return;
    }
    if (e.target.closest("[data-go-home]")) {
      navigateTo("home");
      return;
    }
    if (e.target.closest("[data-go-products]")) {
      navigateTo("scanner");
      return;
    }
  });
 
  // Quick Action Log Buttons
  document.querySelectorAll(".quick-log-btn").forEach((btn, index) => {
    btn.addEventListener("click", () => {
      if (index === 0) navigateTo("home");
      else if (index === 1) navigateTo("scanner");
      else if (index === 2) openCustomFoodModal();
    });
  });
}
 
function hideLoader() {
  const overlay = document.getElementById("app-loading-overlay");
  if (!overlay) return;
  overlay.style.opacity = "0";
  overlay.style.pointerEvents = "none";
  setTimeout(() => overlay.remove(), 500);
}
 
async function init() {
  try {
    renderCategories();
    renderAreas();
    setupEventListeners();
    handleRoute();
  } catch (err) {
    console.error("Init error:", err);
  } finally {
    // The loading screen is always removed, even if something above failed
    hideLoader();
  }
 
  showGridMessage("recipes-grid", "Loading recipes...");
  try {
    const meals = await fetchInitialMeals();
    setMealsState(meals);
    renderMeals(meals);
  } catch (err) {
    console.error("Failed to load initial recipes:", err);
    showGridMessage("recipes-grid", "Could not load recipes. Please check your internet connection.");
  }
}
 
document.addEventListener("DOMContentLoaded", init);