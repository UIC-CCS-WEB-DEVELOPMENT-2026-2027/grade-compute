// Display formatting shared by several screens.

// A grade as "x%", rounded to `decimals` places with trailing zeros removed
// (91.5 -> "91.5%", 90 -> "90%"), or "—" when there is no grade.
export function formatGrade(value, { decimals = 2 } = {}) {
    return value === null || value === undefined ? "—" : `${Number(value.toFixed(decimals))}%`;
}
