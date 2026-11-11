// src/utils/focusTask.js
// Scrolls to a task row in Current Term Records (rows carry
// data-task-id) and highlights it briefly. Used when a point on a History
// chart is clicked. Returns false if the row isn't on the page.
export function focusTaskRow(taskId) {
    if (!taskId || typeof document === "undefined") return false;
    const selector = `[data-task-id="${window.CSS?.escape ? window.CSS.escape(taskId) : taskId}"]`;
    const row = document.querySelector(selector);
    if (!row) return false;

    row.scrollIntoView({ behavior: "smooth", block: "center" });
    row.classList.remove("is-highlighted");
    // Restart the highlight animation if the same row is picked twice.
    void row.offsetWidth;
    row.classList.add("is-highlighted");
    window.setTimeout(() => row.classList.remove("is-highlighted"), 2400);
    row.querySelector("input")?.focus({ preventScroll: true });
    return true;
}
