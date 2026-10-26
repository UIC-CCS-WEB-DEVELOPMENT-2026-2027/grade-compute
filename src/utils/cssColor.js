// src/utils/cssColor.js
// Chart libraries draw SVG with fill/stroke attributes, which can't read CSS
// variables. This returns the actual color of a token like
// "var(--color-primary)" so charts still use the design system.
export function resolveColor(color) {
    const match = /^var\((--[^)]+)\)$/.exec(String(color ?? ""));
    if (!match || typeof document === "undefined") return color;
    return getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim() || color;
}
