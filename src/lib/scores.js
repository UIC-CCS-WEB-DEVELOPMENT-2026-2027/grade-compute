// Score-entry checks shared by Current Term Records and the sandbox drafts.
// The error messages stay in the components.

// Checks typed score text against a task's maxScore (a number or text).
// ok is true when the text is empty (no score) or a valid score: digits with
// an optional decimal part, from 0 to maxScore, and no more digits before
// the decimal than maxScore has (maxScore 50 -> 2, 100 -> 3).
// A maxScore that is not a number only limits the digits, because
// comparisons with NaN are false.
// Also returns maxScore as a number and maxIntegerDigits, for the messages.
export function validateScore(text, maxScore) {
    const max = Number(maxScore);
    const maxIntegerDigits = String(Math.trunc(max)).length;
    if (text === "") return { ok: true, maxScore: max, maxIntegerDigits };
    const score = Number(text);
    const invalid =
        !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) ||
        !Number.isFinite(score) ||
        score < 0 ||
        score > max ||
        text.split(".")[0].length > maxIntegerDigits;
    return { ok: !invalid, maxScore: max, maxIntegerDigits };
}
