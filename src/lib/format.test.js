import { describe, expect, it } from "vitest";
import { formatGrade } from "./format.js";

describe("formatGrade", () => {
    it("shows a dash when there is no grade", () => {
        expect(formatGrade(null)).toBe("—");
        expect(formatGrade(undefined)).toBe("—");
        expect(formatGrade(null, { decimals: 1 })).toBe("—");
    });

    it("rounds to 2 decimals by default and drops trailing zeros", () => {
        expect(formatGrade(90)).toBe("90%");
        expect(formatGrade(91.5)).toBe("91.5%");
        expect(formatGrade(91.456)).toBe("91.46%");
        expect(formatGrade(91.004)).toBe("91%");
        expect(formatGrade(0)).toBe("0%");
        expect(formatGrade(100)).toBe("100%");
    });

    it("rounds to the given number of decimals", () => {
        expect(formatGrade(91.46, { decimals: 1 })).toBe("91.5%");
        expect(formatGrade(91.04, { decimals: 1 })).toBe("91%");
        expect(formatGrade(87.25, { decimals: 1 })).toBe("87.3%");
    });

    it("follows toFixed rounding", () => {
        expect(formatGrade(1.005)).toBe("1%");
        expect(formatGrade(1.255, { decimals: 1 })).toBe("1.3%");
    });
});
