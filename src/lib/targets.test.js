// Tests for targets.js. The getTermTarget and getSandboxTarget tests moved
// here unchanged from history.test.js and sandbox.test.js.
import { describe, expect, it } from "vitest";
import {
    DEFAULT_TARGET,
    getSandboxTarget,
    getSubjectDetailTarget,
    getTermTarget,
} from "./targets.js";

describe("getTermTarget", () => {
    it("follows the chain: term target, record target, 90", () => {
        const record = {
            targetGradeSandbox: {
                desiredFinalGrade: 85,
                terms: { prelim: { desiredFinalGrade: 92 } },
            },
        };
        expect(getTermTarget(record, "prelim")).toBe(92);
        expect(getTermTarget(record, "midterm")).toBe(85);
        expect(getTermTarget({}, "prelim")).toBe(90);
        expect(getTermTarget(null, "prelim")).toBe(90);
    });

    it("ignores the sandbox target", () => {
        const record = {
            targetGradeSandbox: { terms: { prelim: { sandboxDesiredFinalGrade: 70 } } },
        };
        expect(getTermTarget(record, "prelim")).toBe(90);
    });

    it("skips values outside 0–100", () => {
        const record = {
            targetGradeSandbox: {
                desiredFinalGrade: 85,
                terms: { prelim: { desiredFinalGrade: 150 } },
            },
        };
        expect(getTermTarget(record, "prelim")).toBe(85);
        expect(getTermTarget({ targetGradeSandbox: { desiredFinalGrade: -5 } }, "prelim")).toBe(90);
    });
});

describe("getSandboxTarget", () => {
    const record = {
        targetGradeSandbox: {
            desiredFinalGrade: 85,
            sandboxDesiredFinalGrade: 88,
            terms: { prelim: { desiredFinalGrade: 92, sandboxDesiredFinalGrade: 95 } },
        },
    };

    it("follows the chain: term sandbox, term subject, record sandbox, record subject, 90", () => {
        expect(getSandboxTarget(record, "prelim")).toBe(95);

        const noTermSandbox = structuredClone(record);
        delete noTermSandbox.targetGradeSandbox.terms.prelim.sandboxDesiredFinalGrade;
        expect(getSandboxTarget(noTermSandbox, "prelim")).toBe(92);

        expect(getSandboxTarget(record, "midterm")).toBe(88);
        expect(getSandboxTarget({ targetGradeSandbox: { desiredFinalGrade: 85 } }, "prelim")).toBe(
            85,
        );
        expect(getSandboxTarget({}, "prelim")).toBe(90);
        expect(getSandboxTarget(null, "prelim")).toBe(90);
        expect(DEFAULT_TARGET).toBe(90);
    });

    it("skips values outside 0–100 and values that are not numbers", () => {
        const outOfRange = structuredClone(record);
        outOfRange.targetGradeSandbox.terms.prelim.sandboxDesiredFinalGrade = 150;
        expect(getSandboxTarget(outOfRange, "prelim")).toBe(92);

        const invalid = {
            targetGradeSandbox: { sandboxDesiredFinalGrade: "abc", desiredFinalGrade: -1 },
        };
        expect(getSandboxTarget(invalid, "prelim")).toBe(90);
    });

    it("accepts text numbers and the limits 0 and 100", () => {
        expect(
            getSandboxTarget({ targetGradeSandbox: { desiredFinalGrade: "80" } }, "prelim"),
        ).toBe(80);
        expect(getSandboxTarget({ targetGradeSandbox: { desiredFinalGrade: 0 } }, "prelim")).toBe(
            0,
        );
        expect(getSandboxTarget({ targetGradeSandbox: { desiredFinalGrade: 100 } }, "prelim")).toBe(
            100,
        );
    });
});

describe("getSubjectDetailTarget", () => {
    it("follows the chain: term target, record target, 90", () => {
        const record = {
            targetGradeSandbox: {
                desiredFinalGrade: 85,
                terms: { prelim: { desiredFinalGrade: 92, sandboxDesiredFinalGrade: 70 } },
            },
        };
        expect(getSubjectDetailTarget(record, "prelim")).toBe(92);
        expect(getSubjectDetailTarget(record, "midterm")).toBe(85);
        expect(getSubjectDetailTarget({}, "prelim")).toBe(90);
        expect(getSubjectDetailTarget({ targetGradeSandbox: null }, "prelim")).toBe(90);
    });

    it("converts text with Number()", () => {
        expect(
            getSubjectDetailTarget({ targetGradeSandbox: { desiredFinalGrade: "80" } }, "prelim"),
        ).toBe(80);
        expect(
            getSubjectDetailTarget({ targetGradeSandbox: { desiredFinalGrade: "" } }, "prelim"),
        ).toBe(0);
    });

    it("is not range-checked (B11): stored values pass through as they are", () => {
        expect(
            getSubjectDetailTarget({ targetGradeSandbox: { desiredFinalGrade: 150 } }, "prelim"),
        ).toBe(150);
        expect(
            getSubjectDetailTarget({ targetGradeSandbox: { desiredFinalGrade: -5 } }, "prelim"),
        ).toBe(-5);
        expect(
            getSubjectDetailTarget({ targetGradeSandbox: { desiredFinalGrade: "abc" } }, "prelim"),
        ).toBeNaN();
    });

    it("only falls back when the value is null or undefined", () => {
        const record = {
            targetGradeSandbox: {
                desiredFinalGrade: 85,
                terms: { prelim: { desiredFinalGrade: 0 } },
            },
        };
        expect(getSubjectDetailTarget(record, "prelim")).toBe(0);
    });
});
