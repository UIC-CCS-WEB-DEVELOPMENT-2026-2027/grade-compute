import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// "Back" link at the top of a page (AUDIT G13): a secondary button that
// navigates with the router.
export function BackLink({ to, children }) {
    return (
        <Button variant="secondary" nativeButton={false} render={<Link to={to} />}>
            <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
            {children}
        </Button>
    );
}
