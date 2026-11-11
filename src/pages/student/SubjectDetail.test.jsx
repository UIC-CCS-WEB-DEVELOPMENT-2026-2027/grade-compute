// @vitest-environment jsdom
// Characterization tests for Subject Detail: the target fallback, the
// gauges and the target-reached celebration, which still live in the page.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { readRecord, seedBrowser, setupBrowserTests } from "@/test/browser.js";
import { FIXED_NOW } from "@/test/fixedDate.js";
import { makeSeedDb, makeTask } from "@/test/fixtures.js";
import { RequireStudent } from "@/app/RequireStudent";
import { SubjectDetail } from "./SubjectDetail";

setupBrowserTests();

function renderPage(db = makeSeedDb(), url = "/student/subject/C101") {
    seedBrowser(db);
    return render(
        <MemoryRouter initialEntries={[url]}>
            <Routes>
                <Route
                    path="/student/subject/:subjectId"
                    element={
                        <RequireStudent>
                            <SubjectDetail />
                        </RequireStudent>
                    }
                />
            </Routes>
        </MemoryRouter>,
    );
}

function withTarget(targetGradeSandbox) {
    const db = makeSeedDb();
    db.classes[0].studentRecords[0].targetGradeSandbox = targetGradeSandbox;
    return db;
}

const targetInput = (term = "Prelim") => screen.getByLabelText(`${term} target grade`);
const officialGauge = () => screen.getByLabelText(/^Official grade:/);
const expectedGauge = () => screen.getByLabelText(/^Expected grade:/);
const ring = (gauge) => gauge.querySelector('[data-slot="gauge-ring"]');

function commitTarget(value) {
    const input = targetInput();
    fireEvent.change(input, { target: { value } });
    fireEvent.blur(input);
}

describe("target grade", () => {
    it("follows the chain: term target, record target, 90", () => {
        const view = renderPage(
            withTarget({ desiredFinalGrade: 85, terms: { prelim: { desiredFinalGrade: 92 } } }),
        );
        expect(targetInput().value).toBe("92");
        view.unmount();

        const recordOnly = renderPage(withTarget({ desiredFinalGrade: 85 }));
        expect(targetInput().value).toBe("85");
        recordOnly.unmount();

        renderPage(withTarget({}));
        expect(targetInput().value).toBe("90");
    });

    it("reads the term from the URL", () => {
        renderPage(
            withTarget({ desiredFinalGrade: 85, terms: { midterm: { desiredFinalGrade: 70 } } }),
            "/student/subject/C101?term=midterm",
        );
        expect(targetInput("Midterm").value).toBe("70");
    });

    it("ignores the sandbox target", () => {
        renderPage(
            withTarget({
                desiredFinalGrade: 85,
                terms: { prelim: { sandboxDesiredFinalGrade: 60 } },
            }),
        );
        expect(targetInput().value).toBe("85");
    });

    it("is not range-checked when read (docs/AUDIT.md B11)", () => {
        const view = renderPage(withTarget({ terms: { prelim: { desiredFinalGrade: 150 } } }));
        expect(targetInput().value).toBe("150");
        expect(ring(officialGauge()).style.getPropertyValue("--target-angle")).toBe("540deg");
        view.unmount();

        // Number("abc") is NaN: the number input shows it as empty and the
        // target marker gets an invalid angle.
        renderPage(withTarget({ desiredFinalGrade: "abc" }));
        expect(targetInput().value).toBe("");
        expect(ring(officialGauge()).style.getPropertyValue("--target-angle")).toBe("NaNdeg");
    });

    it("saves a new target for the selected term as a number", () => {
        renderPage();
        commitTarget("85");
        expect(readRecord().targetGradeSandbox).toEqual({
            desiredFinalGrade: 90,
            terms: { prelim: { desiredFinalGrade: 85 } },
        });
        expect(targetInput().value).toBe("85");
    });

    it("ignores an empty target and targets outside 0–100", () => {
        renderPage();
        for (const value of ["", "-1", "101"]) {
            commitTarget(value);
            expect(readRecord().targetGradeSandbox).toEqual({ desiredFinalGrade: 90 });
        }
        commitTarget("0");
        expect(readRecord().targetGradeSandbox.terms.prelim.desiredFinalGrade).toBe(0);
        commitTarget("100");
        expect(readRecord().targetGradeSandbox.terms.prelim.desiredFinalGrade).toBe(100);
    });
});

describe("gauges", () => {
    it("show the term grade rounded to 0 decimals, with 2 decimals in the label", () => {
        const db = makeSeedDb();
        db.classes[0].studentRecords[0].grades.prelim.AT[0].officialScore = 17.3; // 86.5%
        renderPage(db);
        expect(officialGauge().getAttribute("aria-label")).toBe("Official grade: 86.50 percent");
        expect(ring(officialGauge()).querySelector("strong").textContent).toBe("87%");
        // Expected: mean(86.5, 90)
        expect(expectedGauge().getAttribute("aria-label")).toBe("Expected grade: 88.25 percent");
        expect(ring(expectedGauge()).querySelector("strong").textContent).toBe("88%");
        expect(ring(officialGauge()).style.getPropertyValue("--grade-progress")).toBe("86.5%");
        expect(ring(officialGauge()).style.getPropertyValue("--target-angle")).toBe("324deg");
    });

    it("clamp the fill to 0–100 but not the number", () => {
        const db = makeSeedDb();
        db.classes[0].studentRecords[0].grades.prelim = {
            AT: [makeTask("a", 20, 25)],
            TLA: [],
            Exam: [],
        };
        renderPage(db);
        expect(officialGauge().getAttribute("aria-label")).toBe("Official grade: 125.00 percent");
        expect(ring(officialGauge()).style.getPropertyValue("--grade-progress")).toBe("100%");
    });

    it('show "—" and an empty fill without a grade', () => {
        renderPage(makeSeedDb(), "/student/subject/C101?term=finals");
        expect(officialGauge().getAttribute("aria-label")).toBe("Official grade: no grade yet");
        expect(expectedGauge().getAttribute("aria-label")).toBe("Expected grade: no grade yet");
        expect(ring(officialGauge()).querySelector("strong").textContent).toBe("—");
        expect(ring(officialGauge()).style.getPropertyValue("--grade-progress")).toBe("0%");
    });

    it("count official assessments with getOfficialAssessments", () => {
        renderPage();
        expect(screen.getByText(/1 official assessment\s*recorded/)).toBeTruthy();
    });
});

describe("page details", () => {
    it("always shows the same semester label (docs/AUDIT.md B7)", () => {
        const db = makeSeedDb();
        Object.assign(db.classes[0], { semester: "Second Semester", academicYear: "2025–2026" });
        renderPage(db);
        expect(screen.getByText("FIRST SEMESTER · 2026–2027")).toBeTruthy();
    });

    it("shows the professor and the units", () => {
        renderPage();
        expect(screen.getAllByText("Prof. Maria Santos").length).toBeGreaterThan(0);
        expect(screen.getByText("PM")).toBeTruthy();
        expect(screen.getByText("3 units")).toBeTruthy();
    });

    it('says "Subject not found" for a class the student is not in', () => {
        renderPage(makeSeedDb(), "/student/subject/C999");
        expect(screen.getByRole("heading", { name: "Subject not found" })).toBeTruthy();
        expect(screen.getByText("This subject is not available for your account.")).toBeTruthy();
    });
});

describe("target-reached celebration", () => {
    it("does not fire for a target that is already reached when the page opens", () => {
        renderPage();
        expect(screen.queryByRole("dialog", { name: "Congratulations!" })).toBeNull();
    });

    it("fires when the official and expected grades both cross the target", () => {
        renderPage(withTarget({ desiredFinalGrade: 95 }));
        commitTarget("85");
        const dialog = screen.getByRole("dialog", { name: "Congratulations!" });
        expect(dialog.textContent).toContain("TARGET ACHIEVED");
        expect(dialog.textContent).toContain(
            "Both your official and expected grades reached the target!",
        );
        expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });

    it("fires on the expected grade alone (docs/AUDIT.md B17)", () => {
        const db = withTarget({ desiredFinalGrade: 95 });
        db.classes[0].studentRecords[0].grades.prelim.AT[0].officialScore = 10; // official 50%
        renderPage(db);
        // Expected: mean(50, 90) = 70, official 50.
        commitTarget("70");
        expect(screen.getByRole("dialog").textContent).toContain(
            "Your expected grade reached the target!",
        );
    });

    it("fires when a score entered on the page lifts the grade over the target", () => {
        renderPage(withTarget({ desiredFinalGrade: 95 }));
        // Prelim expected: AT 90, then TLA 100 -> 93, then Exam 100 -> 95.1.
        const tla = screen.getByLabelText("Private score for TLA 1 - Lab Exercise 1");
        fireEvent.change(tla, { target: { value: "100" } });
        fireEvent.blur(tla);
        expect(screen.queryByRole("dialog")).toBeNull();

        const exam = screen.getByLabelText("Private score for Prelim Exam");
        fireEvent.change(exam, { target: { value: "100" } });
        fireEvent.blur(exam);
        expect(screen.getByRole("dialog").textContent).toContain(
            "Your expected grade reached the target!",
        );
    });

    it("closes with the close button, and on its own after 6 seconds", () => {
        renderPage(withTarget({ desiredFinalGrade: 95 }));
        commitTarget("85");
        fireEvent.click(screen.getByRole("button", { name: "Close congratulations" }));
        expect(screen.queryByRole("dialog")).toBeNull();

        vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
        vi.setSystemTime(FIXED_NOW);
        commitTarget("95");
        commitTarget("80");
        expect(screen.getByRole("dialog")).toBeTruthy();
        act(() => vi.advanceTimersByTime(5999));
        expect(screen.getByRole("dialog")).toBeTruthy();
        act(() => vi.advanceTimersByTime(1));
        expect(screen.queryByRole("dialog")).toBeNull();
    });
});
