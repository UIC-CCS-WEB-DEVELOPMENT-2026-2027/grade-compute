import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Sidebar() {
  const location = useLocation(); // To highlight the active menu item
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <aside className="flex-col" style={{ width: '250px', borderRight: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', padding: '2rem 1rem', minHeight: '100vh' }}>
        <h2>CompUGrade</h2>

        <nav className="flex-col" style={{ marginTop: '2rem', flex: 1 }}>
          <Link
            to="/student/dashboard"
            className={location.pathname.includes('/student/dashboard') ? 'btn-primary' : ''}
            style={{ textDecoration: 'none', padding: '0.5rem', color: location.pathname.includes('/student/dashboard') ? '#FFF' : 'var(--color-text-locked)', borderRadius: '4px' }}
          >
            My Subjects
          </Link>
          <Link
            to="/settings"
            className={location.pathname.includes('/settings') ? 'btn-primary' : ''}
            style={{ textDecoration: 'none', padding: '0.5rem', color: location.pathname.includes('/settings') ? '#FFF' : 'var(--color-text-locked)', borderRadius: '4px' }}
          >
            Settings
          </Link>

          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginTop: 'auto', textAlign: 'left' }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-grid',
                width: '1rem',
                height: '1rem',
                placeItems: 'center',
                border: '1px solid currentColor',
                borderRadius: '50%',
                fontSize: '0.65rem',
                lineHeight: 1,
              }}
            >
              ?
            </span>
            Help &amp; Resources
          </button>

          {/* Pushes the logout button to the bottom */}
          <Link to="/" className="btn-warning" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Logout
          </Link>
        </nav>
      </aside>

      {isHelpOpen && (
      <div
        role="presentation"
        onClick={() => setIsHelpOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(33, 45, 59, 0.34)',
          backdropFilter: 'blur(5px)',
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-modal-title"
          onClick={(event) => event.stopPropagation()}
          style={{
            position: 'relative',
            width: 'min(20rem, calc(100vw - 2rem))',
            padding: '1.65rem 1.35rem 1.55rem',
            borderRadius: '0.35rem',
            background: 'var(--color-surface)',
            boxShadow: '0 1rem 2.5rem rgba(38, 50, 65, 0.18)',
          }}
        >
          <button
            type="button"
            aria-label="Close help and resources"
            onClick={() => setIsHelpOpen(false)}
            style={{
              position: 'absolute',
              top: '0.7rem',
              right: '0.55rem',
              padding: '0.25rem',
              background: 'transparent',
              color: 'var(--color-muted)',
              fontSize: '1.25rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>
          <h2 id="help-modal-title">Help &amp; resources</h2>
          <p>CompuGrade helps you track courses and understand your progress.</p>
          <h3>Getting started</h3>
          <p>Add your courses, review your grades, and use the grade simulator to explore future outcomes. Export your gradebook anytime as a CSV.</p>
        </section>
      </div>
    )}
    </>
  );
}
