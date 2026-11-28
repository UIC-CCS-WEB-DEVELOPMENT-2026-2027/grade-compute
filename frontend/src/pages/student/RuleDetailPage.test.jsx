// @vitest-environment jsdom
// The rule editor builds every save from the data as it is at that moment,
// so a change made after the page opened, such as removing a subject in the
// Sidebar, isn't overwritten (docs/ERROR_HANDLING_REVIEW.md E9), and a
// failed Duplicate says why (E15). It saves nothing when the stored data
// can't be read (T-32).
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { seedBrowser, setupBrowserTests } from "@/test/browser.js";
import { makeSeedDb } from "@/test/fixtures.js";
import { duplicateRule } from "@/lib/rules";
import { RequireStudent } from "@/app/RequireStudent";
import { RuleDetailPage } from "./RuleDetailPage";

setupBrowserTests();

function renderPage(db = makeSeedDb()) {
    seedBrowser(db);
    return render(
        <MemoryRouter initialEntries={["/student/rules/CR-1"]}>
            <Routes>
                <Route
                    path="/student/rules/:ruleId"
                    element={
                        <RequireStudent>
                            <RuleDetailPage />
                        </RequireStudent>
                    }
                />
            </Routes>
        </MemoryRouter>,
    );
}

const storedDb = () => JSON.parse(localStorage.getItem("compugrade_db"));
const storedClassIds = () => storedDb().classes.map((item) => item.id);

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

        expect(storedClassIds()).toEqual([]);
        expect(storedDb().computationRules).toHaveLength(2);
    });

    it("a removed subject doesn't come back after saving an edit", () => {
        renderPage();
        removeSubjectInSidebar();

        fireEvent.click(screen.getByRole("button", { name: "Edit" }));
        fireEvent.change(screen.getByLabelText(/^Rule name/), {
            target: { value: "Renamed rule" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

        expect(storedClassIds()).toEqual([]);
        expect(storedDb().computationRules[0].ruleName).toBe("Renamed rule");
    });
});

describe("a failed Duplicate", () => {
    it("says why when the rule was deleted elsewhere", () => {
        const db = makeSeedDb();
        renderPage(db);
        // Another tab deletes the rule after this page opened.
        localStorage.setItem(
            "compugrade_db",
            JSON.stringify({ ...db, computationRules: [], classes: [] }),
        );

        fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));

        expect(screen.getByRole("status").textContent).toBe("This rule no longer exists.");
        expect(storedDb().computationRules).toEqual([]);
    });
});

const UNAVAILABLE = "Your changes could not be saved because local data is unavailable.";

describe("unreadable stored data", () => {
    it("Duplicate saves nothing and says why", () => {
        renderPage();
        localStorage.setItem("compugrade_db", "not json");

        fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));

        expect(screen.getByRole("status").textContent).toBe(UNAVAILABLE);
        expect(localStorage.getItem("compugrade_db")).toBe("not json");
    });

    it("Save saves nothing and says why", () => {
        renderPage();
        fireEvent.click(screen.getByRole("button", { name: "Edit" }));
        fireEvent.change(screen.getByLabelText(/^Rule name/), {
            target: { value: "Renamed rule" },
        });
        localStorage.setItem("compugrade_db", "not json");

        fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

        expect(screen.getByText(UNAVAILABLE)).toBeTruthy();
        expect(localStorage.getItem("compugrade_db")).toBe("not json");
    });

    it("Delete saves nothing and says why in the dialog", () => {
        renderPage(duplicateRule(makeSeedDb(), "CR-1").db);
        localStorage.setItem("compugrade_db", "not json");

        fireEvent.click(screen.getByRole("button", { name: "Delete" }));
        fireEvent.click(screen.getByRole("button", { name: "Delete rule" }));

        expect(screen.getByRole("alert").textContent).toBe(UNAVAILABLE);
        expect(localStorage.getItem("compugrade_db")).toBe("not json");
    });
});
