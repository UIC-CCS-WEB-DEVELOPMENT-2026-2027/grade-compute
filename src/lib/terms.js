// src/utils/terms.js
// The three grading terms and how they appear in URLs (?term=midterm).
export const TERMS = [
    { key: "prelim", label: "Prelim" },
    { key: "midterm", label: "Midterm" },
    { key: "finals", label: "Finals" },
];

// "Midterm", "midterm" or null -> "midterm". Unknown values fall back to Prelim.
export function toTermKey(value) {
    const key = String(value ?? "").toLowerCase();
    return TERMS.some((term) => term.key === key) ? key : TERMS[0].key;
}

export function getTermLabel(termKey) {
    return TERMS.find((term) => term.key === termKey)?.label ?? TERMS[0].label;
}
