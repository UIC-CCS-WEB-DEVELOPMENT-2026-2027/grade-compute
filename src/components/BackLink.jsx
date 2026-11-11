import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// "Back" link at the top of a page (AUDIT G13): a link that looks like a
// secondary button. It stays a link (not role="button"), so it is announced
// and behaves as one.
export function BackLink({ to, children }) {
    return (
        <Link to={to} className={cn(buttonVariants({ variant: "secondary" }), "no-underline")}>
            <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
            {children}
        </Link>
    );
}
