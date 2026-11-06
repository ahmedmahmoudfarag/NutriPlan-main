import { escapeHTML, showToast } from "./utils.js";
import { navigateTo } from "./ui.js";

const STORAGE_KEY = "nutriplan-food-log";
let memoryStorage = [];

export const DAILY_TARGETS = {
  calories: 2000,
  protein: 50,
  carbohydrates: 250,
  fats: 65,
};

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getFoodLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return memoryStorage;
  }
}

export function saveFoodLog(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    memoryStorage = items;
  }
}

export function addFoodLogItem(item) {
  const newEntry = {
    id: String(Date.now() + Math.random()),
    name: item.name || "Logged Item",
    image: item.image || "",
    calories: Math.max(0, Number(item.calories) || 0),
    protein: Math.max(0, Number(item.protein) || 0),
    carbohydrates: Math.max(0, Number(item.carbohydrates) || 0),
    fats: Math.max(0, Number(item.fats || item.fat) || 0),
    type: item.type || "Meal",
    date: getTodayString(),
    loggedAt: new Date().toISOString(),
  };
  const items = [...getFoodLog(), newEntry];
  saveFoodLog(items);
  return newEntry;
}

export function removeFoodLogItem(id) {
  const items = getFoodLog().filter((item) => item.id !== id);
  saveFoodLog(items);
}

export function clearTodayFoodLog() {
  const today = getTodayString();
  const items = getFoodLog().filter((item) => item.date !== today);
  saveFoodLog(items);
}

export function calculateDailyTotals(dateStr = getTodayString()) {
  const items = getFoodLog().filter((item) => item.date === dateStr);
  return items.reduce(
    (totals, item) => ({
      calories: totals.calories + (Number(item.calories) || 0),
      protein: totals.protein + (Number(item.protein) || 0),
      carbohydrates: totals.carbohydrates + (Number(item.carbohydrates) || 0),
      fats: totals.fats + (Number(item.fats) || 0),
    }),
    { calories: 0, protein: 0, carbohydrates: 0, fats: 0 }
  );
}

export function renderFoodLog() {
  const dateHeader = document.getElementById("foodlog-date");
  if (dateHeader) {
    dateHeader.textContent = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    }).format(new Date());
  }

  const today = getTodayString();
  const items = getFoodLog().filter((item) => item.date === today);
  const totals = calculateDailyTotals(today);

  const container = document.getElementById("foodlog-today-section");
  if (!container) return;

  const stats = [
    { name: "Calories", value: totals.calories, goal: DAILY_TARGETS.calories, unit: "kcal", color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
    { name: "Protein", value: totals.protein, goal: DAILY_TARGETS.protein, unit: "g", color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
    { name: "Carbs", value: totals.carbohydrates, goal: DAILY_TARGETS.carbohydrates, unit: "g", color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
    { name: "Fat", value: totals.fats, goal: DAILY_TARGETS.fats, unit: "g", color: "bg-purple-500", text: "text-purple-700", bg: "bg-purple-50" },
  ];

  const cardsHTML = stats
    .map((s) => {
      const pct = Math.min(100, Math.round((s.value / s.goal) * 100));
      const isExceeded = s.value > s.goal;

      return `
      <div class="${s.bg} rounded-xl p-4 transition-all">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-gray-700">${s.name}</span>
          <span class="text-xs font-bold ${isExceeded ? "text-red-600" : s.text}">${Math.round(s.value)} / ${s.goal} ${s.unit}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div class="${isExceeded ? "bg-red-500" : s.color} h-2.5 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
        </div>
        ${isExceeded ? `<p class="text-[11px] text-red-500 font-semibold mt-1.5"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Goal exceeded by ${Math.round(s.value - s.goal)} ${s.unit}</p>` : ""}
      </div>
    `;
    })
    .join("");

  const loggedHTML = items.length
    ? items
        .map(
          (x) => `
      <article class="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 items-center shadow-xs hover:shadow-md transition-all">
        <img class="w-12 h-12 object-cover rounded-lg bg-gray-100" src="${x.image || "https://placehold.co/96?text=Food"}" alt="${escapeHTML(x.name)}" />
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold px-2 py-0.5 rounded ${x.type === "Product" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}">${x.type || "Meal"}</span>
            <h4 class="font-bold text-gray-900 text-sm">${escapeHTML(x.name)}</h4>
          </div>
          <p class="text-xs text-gray-500 mt-1">${Math.round(x.calories)} kcal · Protein ${Math.round(x.protein)}g · Carbs ${Math.round(x.carbohydrates)}g · Fat ${Math.round(x.fats)}g</p>
        </div>
        <button data-remove="${x.id}" class="text-gray-400 hover:text-red-500 p-2 transition-colors" title="Remove item">
          <i class="fa-solid fa-trash"></i>
        </button>
      </article>
    `
        )
        .join("")
    : `
      <div class="text-center py-10 text-gray-500">
        <i class="fa-solid fa-utensils text-4xl mb-3 text-gray-300"></i>
        <p class="font-medium text-gray-700">No meals logged today</p>
        <p class="text-sm text-gray-400">Add meals from the Recipes section or scan packaged products.</p>
        <div class="flex justify-center gap-3 mt-4">
          <button data-go-home class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"><i class="fa-solid fa-plus mr-1"></i>Browse Recipes</button>
          <button data-go-products class="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"><i class="fa-solid fa-barcode mr-1"></i>Scan Product</button>
        </div>
      </div>
    `;

  container.innerHTML = `
    <h3 class="text-lg font-bold text-gray-900 mb-4">
      <i class="fa-solid fa-fire text-orange-500 mr-2"></i> Today's Nutrition Overview
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      ${cardsHTML}
    </div>
    <div class="border-t border-gray-200 pt-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-semibold text-gray-700">Logged Items (${items.length})</h4>
        ${items.length ? `<button id="clear-foodlog" class="text-red-500 hover:text-red-600 text-sm font-medium"><i class="fa-solid fa-trash mr-1"></i>Clear Today</button>` : ""}
      </div>
      <div id="logged-items-list" class="space-y-2">
        ${loggedHTML}
      </div>
    </div>
  `;

  renderWeeklyChart();
}

export function renderWeeklyChart() {
  const chartContainer = document.getElementById("weekly-chart");
  if (!chartContainer) return;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return d;
  });

  const keyForDate = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const caloriesData = days.map((d) => calculateDailyTotals(keyForDate(d)).calories);

  let plotlySuccess = false;

  if (window.Plotly && typeof window.Plotly.newPlot === "function") {
    try {
      chartContainer.innerHTML = "";
      window.Plotly.newPlot(
        chartContainer,
        [
          {
            x: days.map((d) => d.toLocaleDateString("en-US", { weekday: "short" })),
            y: caloriesData,
            type: "bar",
            marker: { color: "#10b981", borderRadius: 6 },
            hovertemplate: "%{y} kcal<extra></extra>",
          },
        ],
        {
          margin: { l: 40, r: 12, t: 20, b: 35 },
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          yaxis: { title: "Calories", rangemode: "tozero" },
        },
        { responsive: true, displayModeBar: false }
      );
      plotlySuccess = true;
    } catch {
      plotlySuccess = false;
    }
  }

  if (!plotlySuccess) {
    const maxCal = Math.max(DAILY_TARGETS.calories, ...caloriesData, 100);
    const barsHTML = days
      .map((date, idx) => {
        const cal = caloriesData[idx];
        const heightPct = Math.min(100, Math.round((cal / maxCal) * 100));
        const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });
        const isToday = idx === 6;

        return `
        <div class="flex-1 flex flex-col items-center justify-end h-44 gap-1">
          <span class="text-[11px] font-bold text-gray-600">${cal > 0 ? Math.round(cal) : ""}</span>
          <div class="w-full max-w-[32px] bg-gray-100 rounded-t-lg h-36 flex items-end overflow-hidden p-0.5">
            <div class="w-full ${isToday ? "bg-emerald-600" : "bg-emerald-400"} rounded-t transition-all duration-500" style="height: ${Math.max(4, heightPct)}%"></div>
          </div>
          <span class="text-xs font-semibold ${isToday ? "text-emerald-700 font-bold" : "text-gray-500"}">${dayLabel}</span>
        </div>
      `;
      })
      .join("");

    chartContainer.className = "bg-white rounded-xl p-4 border border-gray-200";
    chartContainer.innerHTML = `
      <div class="flex items-end justify-between gap-2 pt-2">
        ${barsHTML}
      </div>
    `;
  }

  const totalWeeklyCal = caloriesData.reduce((a, b) => a + b, 0);
  const avgCal = Math.round(totalWeeklyCal / 7);
  const totalItems = days.reduce(
    (sum, d) => sum + getFoodLog().filter((x) => x.date === keyForDate(d)).length,
    0
  );
  const daysOnGoal = caloriesData.filter(
    (cal) => cal > 0 && cal <= DAILY_TARGETS.calories
  ).length;

  const avgEl = document.getElementById("weekly-average");
  const itemsEl = document.getElementById("weekly-items");
  const goalsEl = document.getElementById("weekly-goals");

  if (avgEl) avgEl.textContent = `${avgCal} kcal`;
  if (itemsEl) itemsEl.textContent = `${totalItems} items`;
  if (goalsEl) goalsEl.textContent = `${daysOnGoal} / 7`;
}

export function confirmClearLog() {
  if (window.Swal) {
    window.Swal.fire({
      title: "Clear Today's Log?",
      text: "Are you sure you want to remove all logged entries for today?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, clear all",
    }).then((result) => {
      if (result.isConfirmed) {
        clearTodayFoodLog();
        renderFoodLog();
        showToast("Today's food log cleared.");
      }
    });
  } else {
    if (confirm("Clear all items logged today?")) {
      clearTodayFoodLog();
      renderFoodLog();
      showToast("Today's food log cleared.");
    }
  }
}

export function openCustomFoodModal() {
  if (!window.Swal) {
    const name = prompt("Enter food name:");
    if (!name) return;
    const calories = Math.max(0, Number(prompt("Enter calories:") || 0));
    addFoodLogItem({
      name,
      calories,
      protein: 0,
      carbohydrates: 0,
      fats: 0,
      type: "Custom",
    });
    renderFoodLog();
    showToast(`Custom food "${name}" added!`);
    return;
  }

  window.Swal.fire({
    title: "Log Custom Food Item",
    html: `
      <div class="space-y-3 text-left">
        <div>
          <label class="text-xs font-semibold text-gray-600 block mb-1">Food / Item Name</label>
          <input id="swal-custom-name" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Greek Yogurt Bowl" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1">Calories (kcal)</label>
            <input id="swal-custom-cal" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="250" />
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1">Protein (g)</label>
            <input id="swal-custom-protein" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="15" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1">Carbs (g)</label>
            <input id="swal-custom-carbs" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="30" />
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1">Fat (g)</label>
            <input id="swal-custom-fat" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="5" />
          </div>
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Add to Log",
    confirmButtonColor: "#10b981",
    preConfirm: () => {
      const name = document.getElementById("swal-custom-name")?.value.trim();
      if (!name) {
        window.Swal.showValidationMessage("Please enter a food name");
        return false;
      }
      return {
        name,
        calories: Math.max(0, Number(document.getElementById("swal-custom-cal")?.value || 0)),
        protein: Math.max(0, Number(document.getElementById("swal-custom-protein")?.value || 0)),
        carbohydrates: Math.max(0, Number(document.getElementById("swal-custom-carbs")?.value || 0)),
        fats: Math.max(0, Number(document.getElementById("swal-custom-fat")?.value || 0)),
        type: "Custom",
      };
    },
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      addFoodLogItem(result.value);
      renderFoodLog();
      showToast(`"${result.value.name}" added to Food Log!`);
    }
  });
}
