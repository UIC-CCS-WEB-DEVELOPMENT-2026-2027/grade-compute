// @vitest-environment jsdom
// Characterization tests for Current Term Records: the score-entry
// validation and custom tasks, which still live inside the component.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { readRecord, seedBrowser, setupBrowserTests } from "@/test/browser.js";
import { FIXED_NOW, FIXED_NOW_ISO } from "@/test/fixedDate.js";
import { makeSeedDb } from "@/test/fixtures.js";
import CurrentTermRecords from "./CurrentTermRecords";

setupBrowserTests();

const TLA_1 = "Private score for TLA 1 - Lab Exercise 1";
const AT_2 = "Private score for AT 2 - Pop Quiz";

function renderRecords(db = makeSeedDb()) {
    seedBrowser(db);
    return render(<CurrentTermRecords classId="C101" term="Prelim" />);
}

function type(input, text) {
    fireEvent.change(input, { target: { value: text } });
}

function storedTask(criterionId, taskId) {
    return readRecord().grades.prelim[criterionId].find((task) => task.id === taskId);
}

describe("the three task states on screen", () => {
    it("locks official scores and offers an input for everything else", () => {
        renderRecords();
        expect(screen.getByText("18 / 20")).toBeTruthy();
        expect(screen.queryByLabelText("Private score for AT 1 - Chapter 4 Quiz")).toBeNull();
        expect(screen.getByLabelText(AT_2).value).toBe("45");
        expect(screen.getByLabelText(TLA_1).value).toBe("");
        expect(screen.getByLabelText("Private score for Prelim Exam").value).toBe("");
    });

    it('treats an official score of "" as locked (docs/AUDIT.md B10)', () => {
        const db = makeSeedDb();
        db.classes[0].studentRecords[0].grades.prelim.TLA[0].officialScore = "";
        renderRecords(db);
        expect(screen.queryByLabelText(TLA_1)).toBeNull();
        expect(screen.getAllByText("Locked · Official")).toHaveLength(2);
    });
});

describe("entering a self-reported score", () => {
    it("saves on blur, as text, with the time of the first score", () => {
        renderRecords();
        const input = screen.getByLabelText(TLA_1);

        type(input, "55");
        expect(input.value).toBe("55");
        expect(storedTask("TLA", "TLA-1").studentReportedScore).toBeNull();

        fireEvent.blur(input);
        expect(storedTask("TLA", "TLA-1")).toMatchObject({
            studentReportedScore: "55",
            studentScoredAt: FIXED_NOW_ISO,
        });
    });

    it("saves when Enter is pressed and throws the draft away on Escape", () => {
        renderRecords();
        const input = screen.getByLabelText(TLA_1);

        input.focus();
        type(input, "60");
        fireEvent.keyDown(input, { key: "Escape" });
        expect(input.value).toBe("");
        expect(storedTask("TLA", "TLA-1").studentReportedScore).toBeNull();

        input.focus();
        type(input, "61");
        fireEvent.keyDown(input, { key: "Enter" });
        expect(storedTask("TLA", "TLA-1").studentReportedScore).toBe("61");
    });

    it('clearing a score saves "" and clears its time', () => {
        renderRecords();
        const input = screen.getByLabelText(AT_2);
        type(input, "");
        fireEvent.blur(input);
        expect(storedTask("AT", "AT-2")).toMatchObject({
            studentReportedScore: "",
            studentScoredAt: null,
        });
    });

    it("accepts digits with an optional decimal part, from 0 to the max score", () => {
        renderRecords();
        const input = screen.getByLabelText(TLA_1);
        for (const text of ["0", "5.", ".5", "99.5", "100", "100.0", "007"]) {
            type(input, text);
            expect(input.value).toBe(text);
            expect(screen.queryByRole("alert")).toBeNull();
        }
    });

    it("rejects the keystroke and explains why when the text is not a valid score", () => {
        renderRecords();
        const input = screen.getByLabelText(TLA_1);
        type(input, "50");

        for (const text of ["101", "100.5", "-1", "abc", "1e1", "5 ", "0100", "1,5"]) {
            type(input, text);
            expect(input.value).toBe("50");
            expect(input.getAttribute("aria-invalid")).toBe("true");
            expect(screen.getByRole("alert").textContent).toBe(
                "Enter a score between 0 and 100, using no more than 3 digits before the decimal.",
            );
        }

        // The next valid keystroke clears the message.
        type(input, "51");
        expect(screen.queryByRole("alert")).toBeNull();
        expect(input.getAttribute("aria-invalid")).toBe("false");
    });

    it("uses the task’s own max score and digit count", () => {
        renderRecords();
        const input = screen.getByLabelText(AT_2);
        type(input, "50.5");
        expect(input.value).toBe("45");
        expect(screen.getByRole("alert").textContent).toBe(
            "Enter a score between 0 and 50, using no more than 2 digits before the decimal.",
        );
        type(input, "050");
        expect(input.value).toBe("45");
        type(input, "50");
        expect(input.value).toBe("50");
    });
});

describe("adding a custom task", () => {
    function openForm() {
        const view = renderRecords();
        fireEvent.click(screen.getByRole("button", { name: "+ Add Custom Task" }));
        return view.container.querySelector("form.add-task-form");
    }

    it("needs a name", () => {
        const form = openForm();
        fireEvent.submit(form);
        expect(screen.getByRole("alert").textContent).toBe("Please enter a task name.");
        expect(readRecord().grades.prelim.AT).toHaveLength(2);
    });

    it("needs a whole-number max score above zero, and only lets digits be typed", () => {
        const form = openForm();
        const maxScore = screen.getByLabelText("Maximum score");
        type(screen.getByLabelText("Sandbox task name"), "Recitation");

        fireEvent.submit(form);
        expect(screen.getByRole("alert").textContent).toBe(
            "Please enter a whole-number maximum score greater than zero.",
        );

        type(maxScore, "2.5");
        expect(maxScore.value).toBe("");
        type(maxScore, "0");
        expect(maxScore.value).toBe("0");
        fireEvent.submit(form);
        expect(screen.getByRole("alert").textContent).toBe(
            "Please enter a whole-number maximum score greater than zero.",
        );
        expect(readRecord().grades.prelim.AT).toHaveLength(2);
    });

    it("adds the task to the first criterion by default and closes the form", () => {
        const form = openForm();
        type(screen.getByLabelText("Sandbox task name"), "  Recitation  ");
        type(screen.getByLabelText("Maximum score"), "25");
        fireEvent.submit(form);

        expect(readRecord().grades.prelim.AT[2]).toEqual({
            id: `CUSTOM-${FIXED_NOW.getTime()}`,
            type: "AT",
            sequenceNumber: null,
            title: "Recitation",
            description: "",
            maxScore: 25,
            officialScore: null,
            studentReportedScore: null,
            isCustomTask: true,
            createdAt: FIXED_NOW_ISO,
        });
        expect(screen.queryByLabelText("Sandbox task name")).toBeNull();
        expect(screen.getByLabelText("Private score for AT - Recitation")).toBeTruthy();
    });

    it("adds the task to the chosen criterion", () => {
        const form = openForm();
        fireEvent.change(screen.getByLabelText("Sandbox task category"), {
            target: { value: "Exam" },
        });
        type(screen.getByLabelText("Sandbox task name"), "Exam bonus");
        type(screen.getByLabelText("Maximum score"), "10");
        fireEvent.submit(form);

        expect(readRecord().grades.prelim.Exam[1]).toMatchObject({
            type: "Exam",
            title: "Exam bonus",
            maxScore: 10,
        });
        expect(screen.getByLabelText("Private score for Exam bonus")).toBeTruthy();
    });
});

describe("when the subject cannot be shown", () => {
    it("says so when the student has no record in the class", () => {
        seedBrowser(makeSeedDb());
        render(<CurrentTermRecords classId="missing" term="Prelim" />);
        expect(screen.getByRole("alert").textContent).toBe(
            "This subject has no student record to display.",
        );
    });

    it("says so when the grading rule no longer exists", () => {
        const db = makeSeedDb();
        db.computationRules = [];
        renderRecords(db);
        expect(screen.getByRole("alert").textContent).toBe(
            "This subject’s grading rule no longer exists. Choose another rule on the Grade Rules page.".replace(
                "’",
                "'",
            ),
        );
    });
});
