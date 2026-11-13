// Target grades. A subject's target is set on Subject Detail, per term, and
// the sandbox may set its own. Without a target, 90 is used.
import { toNumber } from "./number.js";

export const DEFAULT_TARGET = 90;

// The first value that is a number from 0 to 100, otherwise the default.
function firstValidTarget(values) {
    const target = values
        .map(toNumber)
        .find((value) => value !== null && value >= 0 && value <= 100);
    return target ?? DEFAULT_TARGET;
}

// The subject's target for a term (the one set on Subject Detail).
export function getTermTarget(studentRecord, termKey) {
    const config = studentRecord?.targetGradeSandbox ?? {};
    return firstValidTarget([config.terms?.[termKey]?.desiredFinalGrade, config.desiredFinalGrade]);
}

// The sandbox target for a term: the sandbox's own target if the student
// set one, otherwise the subject's target for that term, otherwise 90.
export function getSandboxTarget(studentRecord, termKey) {
    const config = studentRecord?.targetGradeSandbox ?? {};
    const termConfig = config.terms?.[termKey] ?? {};
    return firstValidTarget([
        termConfig.sandboxDesiredFinalGrade,
        termConfig.desiredFinalGrade,
        config.sandboxDesiredFinalGrade,
        config.desiredFinalGrade,
    ]);
}

// The target Subject Detail shows and celebrates against. Unlike the two
// lookups above, the stored value is not range-checked, so it can be NaN or
// outside 0–100 (AUDIT B11, kept as it is).
export function getSubjectDetailTarget(studentRecord, termKey) {
    const config = studentRecord?.targetGradeSandbox ?? {};
    return Number(
        config.terms?.[termKey]?.desiredFinalGrade ?? config.desiredFinalGrade ?? DEFAULT_TARGET,
    );
}

// A target typed on Subject Detail: the number, or null when the box is
// empty, not a number, or outside 0–100 (then nothing is saved).
export function parseTargetInput(value) {
    if (value === "") return null;
    const target = Number(value);
    return Number.isFinite(target) && target >= 0 && target <= 100 ? target : null;
}

// Sets the subject's target for one term on a student record (returns a copy).
export function setTermTarget(studentRecord, termKey, target) {
    const config = studentRecord.targetGradeSandbox ?? {};
    return {
        ...studentRecord,
        targetGradeSandbox: {
            ...config,
            terms: {
                ...(config.terms ?? {}),
                [termKey]: { ...(config.terms?.[termKey] ?? {}), desiredFinalGrade: target },
            },
        },
    };
}
