import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation(); // To highlight the active menu item

  return (
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
        
        {/* Pushes the logout button to the bottom */}
        <Link to="/" className="btn-warning" style={{ textDecoration: 'none', textAlign: 'center', marginTop: 'auto' }}>
          Logout
        </Link>
      </nav>
    </aside>
  );
}