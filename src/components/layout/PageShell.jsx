import { Header } from "@/components/layout/Header";
import { PageFooter } from "@/components/layout/PageFooter";
import { Sidebar } from "@/components/layout/Sidebar";

// The layout every signed-in page shares (AUDIT G2): the Sidebar, and to its
// right a column with the Header, the page content and the PageFooter. The
// column takes the remaining width, so the header and content always line
// up with the sidebar. Pages without a header or footer today keep that
// through showHeader / showFooter; headerProps go to the Header.
export function PageShell({ children, showHeader = true, showFooter = true, headerProps }) {
    return (
        <div className="flex min-h-screen w-full bg-muted">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
                {showHeader && <Header {...headerProps} />}
                <main className="box-border w-full min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8 lg:px-10">
                    {children}
                </main>
                {showFooter && <PageFooter />}
            </div>
        </div>
    );
}
