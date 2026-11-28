// Whether the sidebar is minimized (icons only), shared by every page.
// The shadcn SidebarProvider is controlled from it (AppSidebarProvider), so
// the choice is remembered under the existing key instead of a cookie
// (TASKS.md section 3.2, S1).
// - Screens 768px and wider: remembered in this browser. Until the student
//   picks, it starts minimized on tablets (768–1023px) and open on wider
//   screens.
// - Phones (767px and below) use the slide-in menu instead, which the
//   provider opens and closes.
// The thresholds match Tailwind md (768) and lg (1024) and useIsMobile.
import { useSyncExternalStore } from "react";

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

let state = { minimized: readStoredMinimized() };
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

// { minimized } — re-renders when it changes.
export function useSidebarState() {
    return useSyncExternalStore(
        subscribe,
        () => state,
        () => state,
    );
}
