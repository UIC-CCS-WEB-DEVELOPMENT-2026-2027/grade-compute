import { SidebarProvider } from "@/components/ui/sidebar";
import { setSidebarMinimized, useSidebarState } from "@/hooks/useSidebarState";

// The shadcn SidebarProvider for every signed-in page, controlled from
// useSidebarState (TASKS.md section 3.2, S1/S4): open means not minimized,
// and every change (the toggle, Ctrl/⌘+B) is remembered under the existing
// key. Its wrapper is display: contents, so page layouts are unchanged.
export function AppSidebarProvider({ children }) {
    const { minimized } = useSidebarState();
    return (
        <SidebarProvider
            className="contents"
            open={!minimized}
            onOpenChange={(open) => setSidebarMinimized(!open)}
        >
            {children}
        </SidebarProvider>
    );
}
