// Small number helpers shared by the grade, rule, sandbox and history logic.

// Scores may be stored as numbers or as text from inputs ("45", "").
// Returns a number, or null when the value is empty or invalid.
export function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
