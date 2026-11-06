export function escapeHTML(value = "") {
  const div = document.createElement("div");
  div.textContent = String(value);
  return div.innerHTML;
}

export function showToast(message, type = "success") {
  const colors = {
    success: "bg-emerald-600",
    error: "bg-red-600",
    info: "bg-slate-800",
  };
  const icon =
    type === "success"
      ? "fa-circle-check"
      : type === "error"
      ? "fa-circle-exclamation"
      : "fa-circle-info";

  const toast = document.createElement("div");
  toast.className = `toast-notification fixed right-4 bottom-4 z-[100] ${colors[type] || colors.success} text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3`;
  toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${escapeHTML(message)}</span>`;
  document.body.append(toast);

  setTimeout(() => toast.remove(), 3200);
}

export function setButtonLoading(button, loading, label = "Search") {
  if (!button) return;
  button.disabled = loading;
  button.classList.toggle("opacity-70", loading);
  button.innerHTML = loading
    ? '<i class="fa-solid fa-spinner animate-spin"></i>'
    : label;
}
