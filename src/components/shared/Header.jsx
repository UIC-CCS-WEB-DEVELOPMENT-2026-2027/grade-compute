import './Header.css';

function BellIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header__welcome">
        <h1>Welcome back, Juan!</h1>
        <p>A little progress, every day.</p>
      </div>

      <div className="app-header__account">
        <button className="app-header__notifications" type="button" aria-label="View notifications">
          <BellIcon />
          <span className="app-header__notification-dot" />
        </button>

        <div className="app-header__avatar" aria-hidden="true">JD</div>

        <div className="app-header__profile">
          <strong>Juan Dela Cruz</strong>
          <span>Student · BS Information Technology</span>
        </div>

        <button className="app-header__profile-toggle" type="button" aria-label="Open profile menu">
          <ChevronDownIcon />
        </button>
      </div>
    </header>
  );
}
