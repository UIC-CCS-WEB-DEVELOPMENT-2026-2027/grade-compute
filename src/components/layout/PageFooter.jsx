import "./PageFooter.css";

export default function PageFooter({ className = "" }) {
    return (
        <footer className={`shared-page-footer ${className}`.trim()}>
            <span>A clearer picture. A stronger semester.</span>
            <span className="shared-page-footer-brand">
                <span>CompUGrade</span>
                <span aria-hidden="true">·</span>
                <span>Built for your potential.</span>
            </span>
        </footer>
    );
}
