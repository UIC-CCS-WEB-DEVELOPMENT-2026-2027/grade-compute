import { describe, expect, it } from "vitest";
import { CELEBRATION_MESSAGES, getAchievement, getCelebrationMessage } from "./celebration.js";

const reached = (official, expected) => ({ officialReached: official, expectedReached: expected });

describe("getAchievement", () => {
    it("counts a grade equal to the target as reached", () => {
        expect(getAchievement(90, 89.99, 90)).toEqual(reached(true, false));
        expect(getAchievement(95, 96, 90)).toEqual(reached(true, true));
    });

    it("never counts a missing grade", () => {
        expect(getAchievement(null, null, 0)).toEqual(reached(false, false));
        expect(getAchievement(null, 90, 90)).toEqual(reached(false, true));
    });

    it("never counts anything against a NaN target (B11)", () => {
        expect(getAchievement(100, 100, NaN)).toEqual(reached(false, false));
    });
});

describe("getCelebrationMessage", () => {
    it("says nothing when the page has only just opened", () => {
        expect(getCelebrationMessage(null, reached(true, true))).toBeNull();
    });

    it("celebrates a grade that has just reached the target", () => {
        expect(getCelebrationMessage(reached(false, false), reached(true, true))).toBe(
            "Both your official and expected grades reached the target!",
        );
        expect(getCelebrationMessage(reached(false, true), reached(true, true))).toBe(
            "Your official grade reached the target!",
        );
        expect(getCelebrationMessage(reached(true, false), reached(true, true))).toBe(
            "Your expected grade reached the target!",
        );
        expect(getCelebrationMessage(reached(false, false), reached(false, true))).toBe(
            CELEBRATION_MESSAGES.expected,
        );
    });

    it("says nothing when nothing has newly reached the target", () => {
        expect(getCelebrationMessage(reached(true, true), reached(true, true))).toBeNull();
        expect(getCelebrationMessage(reached(false, false), reached(false, false))).toBeNull();
        expect(getCelebrationMessage(reached(true, true), reached(false, false))).toBeNull();
        expect(getCelebrationMessage(reached(true, false), reached(false, false))).toBeNull();
    });
});
