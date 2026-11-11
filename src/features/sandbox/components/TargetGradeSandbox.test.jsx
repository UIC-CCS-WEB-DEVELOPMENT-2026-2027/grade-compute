// @vitest-environment jsdom
// Characterization tests for the Target Grade Sandbox screen: draft scores,
// score validation, the sandbox inputs and the gauge, which still live in
// the component.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { readRecord, seedBrowser, setupBrowserTests } from "@/test/browser.js";
import { makeSeedDb } from "@/test/fixtures.js";
import { TargetGradeSandbox } from "./TargetGradeSandbox";

setupBrowserTests();

function renderSandbox(db = makeSeedDb(), termKey = "prelim") {
    seedBrowser(db);
    return render(<TargetGradeSandbox classId="C101" termKey={termKey} />);
}

const draftInput = (label) => screen.getByLabelText(`Draft score for ${label}`);
const result = () => screen.getByLabelText(/^Your result/, { selector: "section" });
const termSettings = () => readRecord().targetGradeSandbox.terms?.prelim;

describe("result card", () => {
    it("shows the score needed on each remaining task", () => {
        renderSandbox();
        const card = result();
        expect(card.textContent).toContain("Your result · To reach 90% in Prelim");
        expect(card.textContent).toContain("needed on each remaining task");
        expect(card.textContent).toContain(
            "Score at least 90% on each of your 2 tasks left this term.",
        );
        expect(within(card).getByLabelText("Remaining tasks this applies to").textContent).toBe(
            "Classwork › TLA1 taskExam1 task",
        );
        expect(card.textContent).toContain("Projected Prelim grade90%");
    });

    it('says "Out of reach" when even 100% is not enough', () => {
        const db = makeSeedDb();
        db.classes[0].studentRecords[0].targetGradeSandbox = { desiredFinalGrade: 99 };
        renderSandbox(db);
        expect(result().textContent).toContain("Out of reach");
        expect(result().textContent).toContain(
            "Even 100% on every remaining task gives 95.1%. Try a lower target, or add upcoming tasks if there are more.",
        );
    });
});

describe("gauges", () => {
    it("label the grade with 0 decimals and clamp the fill to 0–100", () => {
        const db = makeSeedDb();
        db.classes[0].studentRecords[0].grades.prelim.AT[0].officialScore = 25; // 125%
        renderSandbox(db);
        const official = screen.getByRole("img", { name: /^Prelim official/ });
        expect(official.getAttribute("aria-label")).toBe("Prelim official: 125 percent");
        expect(official.style.getPropertyValue("--grade-progress")).toBe("100%");
        expect(official.style.getPropertyValue("--target-angle")).toBe("324deg");
        // Expected: mean(125, 90) = 107.5, shown as 108 (toFixed(0)).
        expect(
            screen.getByRole("img", { name: /^Prelim expected/ }).getAttribute("aria-label"),
        ).toBe("Prelim expected: 108 percent");
    });

    it('say "no grade yet" for a term without grades', () => {
        renderSandbox(makeSeedDb(), "midterm");
        const official = screen.getByRole("img", { name: /^Midterm official/ });
        expect(official.getAttribute("aria-label")).toBe("Midterm official: no grade yet");
        expect(official.style.getPropertyValue("--grade-progress")).toBe("0%");
    });
});

// Draft scores are draft-only (the approved B9 fix, AGENTS.md section 3):
// they are stored in targetGradeSandbox.terms[term].draftScores and never
// change the real studentReportedScore.
describe("draft scores", () => {
    it("stores each keystroke as a draft and leaves the real score alone", () => {
        const before = makeSeedDb().classes[0].studentRecords[0].grades;
        renderSandbox();
        const input = draftInput("TLA 1");
        expect(input.value).toBe("");
        expect(input.placeholder).toBe("90");

        fireEvent.change(input, { target: { value: "7" } });
        expect(termSettings()).toEqual({ draftScores: { "TLA-1": "7" } });
        fireEvent.change(input, { target: { value: "75" } });
        expect(termSettings()).toEqual({ draftScores: { "TLA-1": "75" } });
        expect(input.value).toBe("75");
        expect(readRecord().grades).toEqual(before);
    });

    it("feeds the result card and the expected gauge, not the official gauge", () => {
        renderSandbox();
        fireEvent.change(draftInput("TLA 1"), { target: { value: "100" } });
        // TLA 1 = 100 leaves only the exam: (90 - 63 classwork) needs 83% on it.
        expect(result().textContent).toContain("Score at least 83% on each of your 1 task left");
        expect(
            screen.getByRole("img", { name: /^Prelim expected/ }).getAttribute("aria-label"),
        ).toBe("Prelim expected: 93 percent");
        expect(
            screen.getByRole("img", { name: /^Prelim official/ }).getAttribute("aria-label"),
        ).toBe("Prelim official: 90 percent");
    });

    it("starts from the real self-reported score, and a cleared box counts as no score", () => {
        renderSandbox();
        const input = draftInput("AT 2");
        expect(input.value).toBe("45");
        fireEvent.change(input, { target: { value: "" } });
        expect(termSettings()).toEqual({ draftScores: { "AT-2": "" } });
        expect(input.value).toBe("");
        expect(readRecord().grades.prelim.AT[1].studentReportedScore).toBe(45);
        expect(result().textContent).toContain("on each of your 3 tasks left this term.");
    });

    it("locks official scores", () => {
        renderSandbox();
        expect(screen.queryByLabelText("Draft score for AT 1")).toBeNull();
        expect(screen.getByText("18 / 20")).toBeTruthy();
    });

    it("rejects an invalid score without saving it", () => {
        renderSandbox();
        const input = draftInput("TLA 1");
        for (const value of ["101", "-1", "abc", "0100", "1e2"]) {
            fireEvent.change(input, { target: { value } });
            expect(termSettings()).toBeUndefined();
            expect(input.getAttribute("aria-invalid")).toBe("true");
            expect(screen.getByRole("alert").textContent).toBe("Enter a score between 0 and 100.");
        }
    });

    it("a valid score after an invalid one saves, but the message stays", () => {
        renderSandbox();
        const input = draftInput("TLA 1");
        fireEvent.change(input, { target: { value: "101" } });
        fireEvent.change(input, { target: { value: "100" } });
        expect(termSettings()).toEqual({ draftScores: { "TLA-1": "100" } });
        expect(input.getAttribute("aria-invalid")).toBe("false");
        expect(screen.queryByRole("alert")).toBeNull();
    });
});

describe("sandbox settings", () => {
    it("saves the sandbox target on blur", () => {
        renderSandbox();
        const input = screen.getByLabelText(/^Prelim target grade/);
        fireEvent.change(input, { target: { value: "85.5" } });
        expect(termSettings()).toBeUndefined();
        fireEvent.blur(input);
        expect(termSettings()).toEqual({ sandboxDesiredFinalGrade: 85.5, criteria: {} });
    });

    it("rejects a target outside 0–100 and keeps the saved one", () => {
        renderSandbox();
        const input = screen.getByLabelText(/^Prelim target grade/);
        fireEvent.change(input, { target: { value: "120" } });
        fireEvent.blur(input);
        expect(screen.getByRole("alert").textContent).toBe("Enter a target grade from 0 to 100.");
        expect(input.value).toBe("90");
        expect(termSettings()).toBeUndefined();
    });

    it("saves upcoming tasks on every change, rounded and clamped to 0–20", () => {
        renderSandbox();
        const input = screen.getByLabelText("Upcoming AT tasks not added yet");
        fireEvent.change(input, { target: { value: "2.6" } });
        expect(termSettings().criteria.AT).toEqual({ upcoming: 3 });
        fireEvent.change(input, { target: { value: "25" } });
        expect(termSettings().criteria.AT).toEqual({ upcoming: 20 });
    });

    it("clearing upcoming tasks saves 0 at once (docs/AUDIT.md B16)", () => {
        renderSandbox();
        const input = screen.getByLabelText("Upcoming AT tasks not added yet");
        fireEvent.change(input, { target: { value: "2" } });
        fireEvent.change(input, { target: { value: "" } });
        expect(termSettings().criteria.AT).toEqual({ upcoming: 0 });
        expect(input.value).toBe("0");
    });

    it("saves the expected % clamped to 0–100, and null when cleared", () => {
        renderSandbox();
        const input = screen.getByLabelText(
            "Expected percentage for remaining Exam tasks (leave empty to calculate)",
        );
        fireEvent.change(input, { target: { value: "130" } });
        expect(termSettings().criteria.Exam).toEqual({ expected: 100 });
        fireEvent.change(input, { target: { value: "80" } });
        expect(termSettings().criteria.Exam).toEqual({ expected: 80 });
        fireEvent.change(input, { target: { value: "" } });
        expect(termSettings().criteria.Exam).toEqual({ expected: null });
    });
});

describe("when the subject cannot be planned", () => {
    it("says so when the student has no record", () => {
        seedBrowser(makeSeedDb(), "U2");
        render(<TargetGradeSandbox classId="C101" termKey="prelim" />);
        expect(screen.getByText("This subject is not available for your account.")).toBeTruthy();
    });

    it("says so when the rule is missing", () => {
        const db = makeSeedDb();
        db.computationRules = [];
        renderSandbox(db);
        expect(
            screen.getByText(
                "This subject has no grading rule yet. Choose one on the Grade Rules page.",
            ),
        ).toBeTruthy();
    });
});
