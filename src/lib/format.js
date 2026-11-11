// Display formatting shared by several screens.
import { clamp } from "./number.js";

// A grade as "x%", rounded to `decimals` places with trailing zeros removed
// (91.5 -> "91.5%", 90 -> "90%"), or "—" when there is no grade.
export function formatGrade(value, { decimals = 2 } = {}) {
    return value === null || value === undefined ? "—" : `${Number(value.toFixed(decimals))}%`;
}

// How full a grade gauge is drawn, in percent: the grade kept within 0–100,
// or 0 when there is no grade yet.
export function getGaugeProgress(grade) {
    return grade === null ? 0 : clamp(grade, 0, 100);
}

// Avatar initials: the first letters of the first two words, upper-cased.
// There are two versions because they treat extra spaces differently, and
// merging them would change what some typed names show (AUDIT G5):
//   "Ana  Cruz" (two spaces) -> getInitials "AC", getSpaceSplitInitials "A"
//   " Ana Cruz" (leading space) -> getInitials "AC", getSpaceSplitInitials "A"

// Header avatar. Splits on any whitespace and skips empty parts.
export function getInitials(name) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

// Settings profile avatar and Subject Detail instructor avatar. Splits on
// single spaces, so each extra space counts as an empty word.
export function getSpaceSplitInitials(name) {
    return name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}
