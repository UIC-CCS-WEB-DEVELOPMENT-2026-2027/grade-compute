import { describe, expect, it } from "vitest";
import { validateScore } from "./scores.js";

const ok = (text, maxScore) => validateScore(text, maxScore).ok;

describe("validateScore", () => {
    it("accepts an empty value (no score)", () => {
        expect(ok("", 50)).toBe(true);
    });

    it("accepts scores from 0 to maxScore", () => {
        expect(ok("0", 50)).toBe(true);
        expect(ok("45", 50)).toBe(true);
        expect(ok("50", 50)).toBe(true);
        expect(ok("12.5", 50)).toBe(true);
        expect(ok("12.", 50)).toBe(true);
        expect(ok(".5", 50)).toBe(true);
    });

    it("rejects scores above maxScore", () => {
        expect(ok("51", 50)).toBe(false);
        expect(ok("50.01", 50)).toBe(false);
    });

    it("rejects text that is not plain digits", () => {
        expect(ok("-1", 50)).toBe(false);
        expect(ok("abc", 50)).toBe(false);
        expect(ok("1e1", 50)).toBe(false);
        expect(ok(" 5", 50)).toBe(false);
        expect(ok("1.2.3", 50)).toBe(false);
        expect(ok(".", 50)).toBe(false);
    });

    it("rejects more integer digits than maxScore has", () => {
        expect(ok("05", 9)).toBe(false);
        expect(ok("005", 50)).toBe(false);
        expect(ok("050", 100)).toBe(true);
    });

    it("accepts maxScore as text", () => {
        expect(ok("45", "50")).toBe(true);
        expect(ok("51", "50")).toBe(false);
    });

    it("only limits the digits when maxScore is not a number", () => {
        expect(ok("999", undefined)).toBe(true);
        expect(ok("1000", undefined)).toBe(false);
    });

    it("returns maxScore as a number and its integer digit count", () => {
        expect(validateScore("", "50")).toEqual({ ok: true, maxScore: 50, maxIntegerDigits: 2 });
        expect(validateScore("7", 100)).toEqual({ ok: true, maxScore: 100, maxIntegerDigits: 3 });
        expect(validateScore("7", 12.5)).toEqual({ ok: true, maxScore: 12.5, maxIntegerDigits: 2 });
        expect(validateScore("7", undefined)).toMatchObject({ maxScore: NaN, maxIntegerDigits: 3 });
    });
});
