// @vitest-environment jsdom
// The Sidebar is on every signed-in page, so damaged stored data must not
// crash it (docs/ERROR_HANDLING_REVIEW.md E7): a missing list counts as empty.
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { seedBrowser, setupBrowserTests } from "@/test/browser.js";
import { makeSeedDb } from "@/test/fixtures.js";
import { RequireStudent } from "@/app/RequireStudent";
import { Sidebar } from "./Sidebar";

setupBrowserTests();

// On a subject page the My Subjects list is open; each row has a Remove button.
function renderSidebar(db = makeSeedDb()) {
    seedBrowser(db);
    return render(
        <MemoryRouter initialEntries={["/student/subject"]}>
            <Routes>
                <Route
                    path="*"
                    element={
                        <RequireStudent>
                            <Sidebar />
                        </RequireStudent>
                    }
                />
            </Routes>
        </MemoryRouter>,
    );
}

const subjectRows = () =>
    screen
        .getAllByRole("button", { name: /^Remove .* from your subjects$/ })
        .map((button) => button.getAttribute("aria-label"));

describe("enrolled subjects", () => {
    it("lists the student's subjects", () => {
        renderSidebar();
        expect(subjectRows()).toEqual([
            "Remove IT101 - Computer Systems Servicing from your subjects",
        ]);
    });
});

describe("damaged stored data", () => {
    it("skips a class without studentRecords", () => {
        const db = makeSeedDb();
        db.classes.push({ id: "C900", subjectId: db.subjects[0].id });
        db.classes.push({ id: "C901", subjectId: db.subjects[0].id, studentRecords: null });

        renderSidebar(db);
        expect(subjectRows()).toEqual([
            "Remove IT101 - Computer Systems Servicing from your subjects",
        ]);
    });

    it("shows a class as Unknown when the database has no subjects", () => {
        const db = makeSeedDb();
        delete db.subjects;

        renderSidebar(db);
        expect(subjectRows()).toEqual(["Remove Unknown - Unknown from your subjects"]);
    });
});
