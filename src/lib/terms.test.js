// Characterization tests for terms.js.
import { describe, expect, it } from "vitest";
import { getTermLabel, TERM_KEYS, TERM_LABELS, TERMS, toTermKey } from "./terms.js";

describe("terms", () => {
    it("lists the three terms in order", () => {
        expect(TERMS).toEqual([
            { key: "prelim", label: "Prelim" },
            { key: "midterm", label: "Midterm" },
            { key: "finals", label: "Finals" },
        ]);
    });

    it("derives the term keys and labels from the list", () => {
        expect(TERM_KEYS).toEqual(["prelim", "midterm", "finals"]);
        expect(TERM_LABELS).toEqual({ prelim: "Prelim", midterm: "Midterm", finals: "Finals" });
    });

    it("toTermKey lower-cases a known term", () => {
        expect(toTermKey("Midterm")).toBe("midterm");
        expect(toTermKey("FINALS")).toBe("finals");
        expect(toTermKey("prelim")).toBe("prelim");
    });

    it("toTermKey falls back to prelim for anything else", () => {
        expect(toTermKey(null)).toBe("prelim");
        expect(toTermKey(undefined)).toBe("prelim");
        expect(toTermKey("")).toBe("prelim");
        expect(toTermKey("summer")).toBe("prelim");
        expect(toTermKey(" midterm ")).toBe("prelim");
    });

    it("getTermLabel returns the label, or Prelim for an unknown key", () => {
        expect(getTermLabel("finals")).toBe("Finals");
        expect(getTermLabel("Finals")).toBe("Prelim");
        expect(getTermLabel(undefined)).toBe("Prelim");
    });
});
