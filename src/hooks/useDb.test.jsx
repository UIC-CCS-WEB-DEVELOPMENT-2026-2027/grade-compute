// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeSeedDb } from "@/test/fixtures.js";
import { saveDb } from "@/services/db";
import { useDb } from "./useDb.js";

beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("compugrade_db", JSON.stringify(makeSeedDb()));
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useDb", () => {
    it("starts with the stored database", () => {
        const { result } = renderHook(() => useDb());
        expect(result.current[0]).toEqual(makeSeedDb());
    });

    it("re-reads when the database is saved elsewhere (live, the default)", () => {
        const { result } = renderHook(() => useDb());
        const updated = { ...makeSeedDb(), users: [] };
        act(() => saveDb(updated));
        expect(result.current[0]).toEqual(updated);
    });

    it("ignores saves made elsewhere when live is false", () => {
        const { result } = renderHook(() => useDb({ live: false }));
        act(() => saveDb({ ...makeSeedDb(), users: [] }));
        expect(result.current[0]).toEqual(makeSeedDb());
    });

    it("setDb replaces the state", () => {
        const { result } = renderHook(() => useDb({ live: false }));
        const next = { ...makeSeedDb(), classes: [] };
        act(() => result.current[1](next));
        expect(result.current[0]).toBe(next);
    });

    it("stops listening when unmounted", () => {
        const remove = vi.spyOn(window, "removeEventListener");
        const { unmount } = renderHook(() => useDb());
        unmount();
        expect(remove).toHaveBeenCalledWith("compugrade-db-updated", expect.any(Function));
    });
});
