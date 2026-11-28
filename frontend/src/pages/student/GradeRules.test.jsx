// @vitest-environment jsdom
// Grade Rules builds every save from the data as it is at that moment, so a
// change made after the page opened, such as removing a subject in the
// Sidebar, isn't overwritten (docs/ERROR_HANDLING_REVIEW.md E9).
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { seedBrowser, setupBrowserTests } from "@/test/browser.js";
import { makeSeedDb } from "@/test/fixtures.js";
import { RequireStudent } from "@/app/RequireStudent";
import { duplicateRule } from "@/lib/rules";
import { GradeRules } from "./GradeRules";

setupBrowserTests();

function renderPage(db = makeSeedDb()) {
    seedBrowser(db);
    return render(
        <MemoryRouter initialEntries={["/student/rules"]}>
            <Routes>
                <Route
                    path="/student/rules"
                    element={
                        <RequireStudent>
                            <GradeRules />
                        </RequireStudent>
                    }
                />
                <Route path="/student/rules/:ruleId" element={<p>Rule page</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

const storedClassIds = () =>
    JSON.parse(localStorage.getItem("compugrade_db")).classes.map((item) => item.id);

function removeSubjectInSidebar() {
    fireEvent.click(screen.getByRole("button", { name: "Expand subject list" }));
    fireEvent.click(
        screen.getByRole("button", {
            name: "Remove IT101 - Computer Systems Servicing from your subjects",
        }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Yes, remove it" }));
}

describe("saves use the data as it is now", () => {
    it("a removed subject doesn't come back after Duplicate", () => {
        renderPage();
        removeSubjectInSidebar();
        expect(storedClassIds()).toEqual([]);

        fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));

        expect(screen.getByText("Rule page")).toBeTruthy();
        expect(storedClassIds()).toEqual([]);
        expect(JSON.parse(localStorage.getItem("compugrade_db")).computationRules).toHaveLength(2);
    });

    it("a removed subject doesn't come back after deleting a rule", () => {
        const { db } = duplicateRule(makeSeedDb(), "CR-1");
        const copy = db.computationRules[1];
        renderPage(db);
        removeSubjectInSidebar();

        const copyCard = screen.getByRole("link", { name: copy.ruleName }).closest("article");
        fireEvent.click(within(copyCard).getByRole("button", { name: "Delete" }));
        fireEvent.click(screen.getByRole("button", { name: "Delete rule" }));

        expect(storedClassIds()).toEqual([]);
        expect(
            JSON.parse(localStorage.getItem("compugrade_db")).computationRules.map(
                (rule) => rule.id,
            ),
        ).toEqual(["CR-1"]);
    });
});
