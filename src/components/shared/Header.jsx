import './Header.css';
import { getDb } from '../../utils/db';

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

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function Header({
  title,
  subtitle = 'A little progress, every day.',
  user,
}) {
  const dbData = getDb();
  const activeUserId = localStorage.getItem('activeUserId') || 'U1';
  const activeUser = dbData?.users?.find((item) => item.id === activeUserId);
  const profile = user ?? activeUser ?? {
    name: 'Student',
    role: 'student',
    programSection: '',
  };
  const name = profile.name || 'Student';
  const role = profile.role
    ? `${profile.role[0].toUpperCase()}${profile.role.slice(1)}`
    : 'Student';
  const profileDescription = profile.programSection
    ? `${role} · ${profile.programSection}`
    : `${role} · CompUGrade`;
  const welcomeTitle = title ?? `Welcome back, ${name.split(/\s+/)[0]}!`;

  return (
    <header className="app-header">
      <div className="app-header__welcome">
        <h1>{welcomeTitle}</h1>
        {subtitle !== null && <p>{subtitle}</p>}
      </div>

      <div className="app-header__account">
        <button className="app-header__notifications" type="button" aria-label="View notifications">
          <BellIcon />
          <span className="app-header__notification-dot" />
        </button>

        <div className="app-header__avatar" aria-hidden="true">{getInitials(name)}</div>

        <div className="app-header__profile">
          <strong>{name}</strong>
          <span>{profileDescription}</span>
        </div>

        <button className="app-header__profile-toggle" type="button" aria-label="Open profile menu">
          <ChevronDownIcon />
        </button>
      </div>
    </header>
  );
}
