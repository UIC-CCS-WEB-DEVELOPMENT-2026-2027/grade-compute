// The three grading terms and how they appear in URLs (?term=midterm).
export const TERMS = [
    { key: "prelim", label: "Prelim" },
    { key: "midterm", label: "Midterm" },
    { key: "finals", label: "Finals" },
];

export const TERM_KEYS = TERMS.map((term) => term.key);
export const TERM_LABELS = Object.fromEntries(TERMS.map((term) => [term.key, term.label]));

// "Midterm", "midterm" or null -> "midterm". Unknown values fall back to Prelim.
export function toTermKey(value) {
    const key = String(value ?? "").toLowerCase();
    return TERMS.some((term) => term.key === key) ? key : TERMS[0].key;
}

export function getTermLabel(termKey) {
    return TERMS.find((term) => term.key === termKey)?.label ?? TERMS[0].label;
}
