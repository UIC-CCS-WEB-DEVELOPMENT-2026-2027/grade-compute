import Header from '../components/shared/Header';
import Sidebar from '../components/shared/Sidebar';

export default function GlobalSettings() {
  return (
    <div className="flex-row" style={{ minHeight: '100vh', gap: 0 }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Header />
        <main className="container" style={{ padding: '2rem', flex: 1 }}>
          <h2>Settings</h2>
          <p>User profile and preferences go here.</p>
        </main>
      </div>
    </div>
  );
}