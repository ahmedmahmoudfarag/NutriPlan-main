import { escapeHTML } from "./utils.js";
import { renderFoodLog } from "./foodLog.js";
import { renderProducts } from "./products.js";
import { openMealDetails } from "./recipes.js";
 
const sections = {
  home: ["search-filters-section", "meal-categories-section", "all-recipes-section"],
  details: ["meal-details"],
  products: ["products-section"],
  foodlog: ["foodlog-section"],
};
 
export function openSidebar() {
  document.getElementById("sidebar")?.classList.add("open");
  document.getElementById("sidebar-overlay")?.classList.add("active");
}
 
export function closeSidebar() {
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("sidebar-overlay")?.classList.remove("active");
}
 
export function handleRoute() {
  let path = location.hash ? location.hash.substring(1) : location.pathname.substring(1);
  if (path.startsWith("/")) path = path.substring(1);
 
  const parts = (path || "home").split("/");
  const rawView = parts[0] || "home";
  const id = parts[1] || "";
 
  let view = "home";
  if (rawView === "scanner" || rawView === "products") {
    view = "products";
  } else if (rawView === "foodlog") {
    view = "foodlog";
  } else if (rawView === "meal" || rawView === "details") {
    view = "details";
  } else {
    view = "home";
  }
 
  // Hide all sections
  Object.values(sections)
    .flat()
    .forEach((secId) => {
      const el = document.getElementById(secId);
      if (el) el.style.display = "none";
    });
 
  // Show active view sections
  const activeSections = sections[view] || sections.home;
  activeSections.forEach((secId) => {
    const el = document.getElementById(secId);
    if (el) el.style.display = "";
  });
 
  // Highlight active sidebar navigation link
  document.querySelectorAll(".nav-link").forEach((link) => {
    const text = link.textContent.toLowerCase();
    const target = text.includes("scanner")
      ? "products"
      : text.includes("food log")
      ? "foodlog"
      : "home";
    const isMatch = target === view;
    link.classList.toggle("bg-emerald-50", isMatch);
    link.classList.toggle("text-emerald-700", isMatch);
    link.classList.toggle("text-gray-600", !isMatch);
  });
 
  // Update header titles
  const titles = {
    home: ["Meals & Recipes", "Discover delicious and nutritious recipes tailored for you"],
    products: ["Product Scanner", "Search packaged foods by name or barcode"],
    foodlog: ["Food Log", "Track your daily nutrition and food intake"],
    details: ["Recipe Details", "Ingredients, instructions, and nutrition facts"],
  };
  const currentTitle = titles[view] || titles.home;
  const pageTitleEl = document.getElementById("page-title");
  const pageSubtitleEl = document.getElementById("page-subtitle");
  if (pageTitleEl) pageTitleEl.textContent = currentTitle[0];
  if (pageSubtitleEl) pageSubtitleEl.textContent = currentTitle[1];
 
  window.scrollTo({ top: 0, behavior: "smooth" });
 
  if (view === "foodlog") {
    renderFoodLog();
  } else if (view === "products") {
    renderProducts();
  } else if (view === "details" && id) {
    openMealDetails(id);
  }
}
 
export function navigateTo(path) {
  // Changing the hash fires "hashchange", which already calls handleRoute().
  // Only call it manually when the hash is unchanged (no event will fire).
  if (location.hash === `#${path}`) {
    handleRoute();
  } else {
    location.hash = path;
  }
}
 
export function showGridMessage(id, text) {
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = `<p class="col-span-full text-center py-12 text-gray-500">${escapeHTML(text)}</p>`;
  }
}