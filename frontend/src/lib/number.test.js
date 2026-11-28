import { describe, expect, it } from "vitest";
import { clamp, toNumber } from "./number.js";

describe("toNumber", () => {
    it("returns null for empty values", () => {
        expect(toNumber(null)).toBeNull();
        expect(toNumber(undefined)).toBeNull();
        expect(toNumber("")).toBeNull();
    });

    it("parses numbers and numeric text", () => {
        expect(toNumber(45)).toBe(45);
        expect(toNumber("45")).toBe(45);
        expect(toNumber("12.5")).toBe(12.5);
        expect(toNumber(0)).toBe(0);
        expect(toNumber("0")).toBe(0);
        expect(toNumber(-3)).toBe(-3);
    });

    it("treats whitespace-only text as zero, like Number()", () => {
        expect(toNumber(" ")).toBe(0);
    });

    it("returns null for invalid and non-finite values", () => {
        expect(toNumber("abc")).toBeNull();
        expect(toNumber("12abc")).toBeNull();
        expect(toNumber(NaN)).toBeNull();
        expect(toNumber(Infinity)).toBeNull();
        expect(toNumber("Infinity")).toBeNull();
        expect(toNumber({})).toBeNull();
    });

    it("follows Number() for booleans and arrays", () => {
        expect(toNumber(true)).toBe(1);
        expect(toNumber(false)).toBe(0);
        expect(toNumber([])).toBe(0);
        expect(toNumber([7])).toBe(7);
    });
});

describe("clamp", () => {
    it("keeps values inside the range", () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(0, 0, 10)).toBe(0);
        expect(clamp(10, 0, 10)).toBe(10);
    });

    it("limits values outside the range", () => {
        expect(clamp(-1, 0, 10)).toBe(0);
        expect(clamp(11, 0, 10)).toBe(10);
    });

    it("returns NaN for NaN input", () => {
        expect(clamp(NaN, 0, 10)).toBeNaN();
    });
});
