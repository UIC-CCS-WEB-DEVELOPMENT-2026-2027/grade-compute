import { describe, expect, it } from "vitest";
import { formatGrade, getGaugeProgress, getInitials, getSpaceSplitInitials } from "./format.js";
import { makeSeedDb } from "@/test/fixtures.js";

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

// AUDIT G5: Header, Settings and Subject Detail each built initials. The
// Settings and Subject Detail code was identical (getSpaceSplitInitials);
// Header's (getInitials) differs on extra spaces, so the two stay separate.
describe("initials", () => {
    it("both versions agree on every name in the seed data", () => {
        const db = makeSeedDb();
        const names = [
            ...db.users.map((user) => user.name),
            ...db.classes.map((item) => item.professorName).filter(Boolean),
            "Awaiting professor assignment",
            "Student",
        ];
        for (const name of names) {
            expect(getSpaceSplitInitials(name)).toBe(getInitials(name));
        }
        expect(getInitials("Ysa Ang")).toBe("YA");
        expect(getInitials("Prof. Maria Santos")).toBe("PM");
        expect(getInitials("Awaiting professor assignment")).toBe("AP");
        expect(getInitials("Student")).toBe("S");
    });

    it("handle lower-case names and single words alike", () => {
        expect(getInitials("ana cruz")).toBe("AC");
        expect(getSpaceSplitInitials("ana cruz")).toBe("AC");
        expect(getInitials("Ana")).toBe("A");
        expect(getSpaceSplitInitials("Ana")).toBe("A");
    });

    it("differ on extra spaces, which a typed name can contain", () => {
        expect(getInitials("Ana  Cruz")).toBe("AC");
        expect(getSpaceSplitInitials("Ana  Cruz")).toBe("A");
        expect(getInitials(" Ana Cruz")).toBe("AC");
        expect(getSpaceSplitInitials(" Ana Cruz")).toBe("A");
        expect(getInitials("Ana\tCruz")).toBe("AC");
        expect(getSpaceSplitInitials("Ana\tCruz")).toBe("A");
    });

    it("give an empty string for an empty name", () => {
        expect(getInitials("")).toBe("");
        expect(getSpaceSplitInitials("")).toBe("");
        expect(getInitials("   ")).toBe("");
        expect(getSpaceSplitInitials("   ")).toBe("");
    });
});

describe("getGaugeProgress", () => {
    it("is 0 when there is no grade", () => {
        expect(getGaugeProgress(null)).toBe(0);
    });

    it("keeps the grade within 0-100", () => {
        expect(getGaugeProgress(87.5)).toBe(87.5);
        expect(getGaugeProgress(0)).toBe(0);
        expect(getGaugeProgress(100)).toBe(100);
        expect(getGaugeProgress(107.5)).toBe(100);
        expect(getGaugeProgress(-3)).toBe(0);
    });

    it("passes NaN through, like Math.min and Math.max", () => {
        expect(getGaugeProgress(NaN)).toBeNaN();
    });
});
