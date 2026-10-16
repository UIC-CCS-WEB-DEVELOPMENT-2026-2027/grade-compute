// src/pages/student/StudentDashboard.jsx
import Sidebar from '../../components/shared/Sidebar';
import Header from '../../components/shared/Header';
import SubjectCard from '../../components/student/SubjectCard';

export default function StudentDashboard() {
  // TODO: Initialize database state and filter enrolled classes

  return (
    <div className="flex-row" style={{ minHeight: '100vh', gap: 0 }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Header />
        <main className="container" style={{ padding: '2rem', flex: 1 }}>
        <h2>Student Dashboard</h2>
        <p>List of enrolled subjects goes here.</p>
        <SubjectCard  />
        {/* Developer implementation for displaying SubjectCards goes here */}

        </main>
      </div>
    </div>
  );
}