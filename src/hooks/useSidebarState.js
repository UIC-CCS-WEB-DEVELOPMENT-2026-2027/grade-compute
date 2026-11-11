// src/components/shared/useSidebarState.js
// Shared sidebar state, used by Sidebar and by Header's ☰ button.
// - minimized: the sidebar shows icons only (screens 768px and wider).
//   Remembered in this browser. Until the student picks, it starts
//   minimized on tablets (768–1023px) and open on wider screens.
// - menuOpen: on phones (767px and below) the sidebar is a slide-in menu.
// The thresholds match Tailwind md (768) and lg (1024) and useIsMobile.
import { useSyncExternalStore } from "react";

export const PHONE_MAX_WIDTH = 767;
const TABLET_MAX_WIDTH = 1023;
const STORAGE_KEY = "compugrade-sidebar-minimized";

function readStoredMinimized() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "1") return true;
        if (stored === "0") return false;
    } catch {
        // Storage blocked: fall back to the screen-size default.
    }
    return typeof window !== "undefined" && window.innerWidth <= TABLET_MAX_WIDTH;
}

let state = { minimized: readStoredMinimized(), menuOpen: false };
const listeners = new Set();

function setState(changes) {
    state = { ...state, ...changes };
    listeners.forEach((listener) => listener());
}

function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function setSidebarMinimized(minimized) {
    try {
        localStorage.setItem(STORAGE_KEY, minimized ? "1" : "0");
    } catch {
        // Not remembered, but still applied for this visit.
    }
    setState({ minimized });
}

export function setSidebarMenuOpen(menuOpen) {
    if (state.menuOpen !== menuOpen) setState({ menuOpen });
}

// { minimized, menuOpen } — re-renders when either changes.
export function useSidebarState() {
    return useSyncExternalStore(
        subscribe,
        () => state,
        () => state,
    );
}
