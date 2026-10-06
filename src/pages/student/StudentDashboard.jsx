// src/pages/student/StudentDashboard.jsx
import { useState, useEffect } from 'react';
import Sidebar from '../../components/shared/Sidebar';
import SubjectCard from '../../components/student/SubjectCard';
import { getDb } from '../../utils/db';

export default function StudentDashboard() {
  // TODO: Initialize database state and filter enrolled classes

  return (
    <div className="flex-row" style={{ minHeight: '100vh', gap: 0 }}>
      <Sidebar />
      <main className="container" style={{ padding: '2rem', flex: 1 }}>
        <h2>Student Dashboard</h2>
        <p>List of enrolled subjects goes here.</p>
        <SubjectCard  />
        {/* Developer implementation for displaying SubjectCards goes here */}
        
      </main>
    </div>
  );
}