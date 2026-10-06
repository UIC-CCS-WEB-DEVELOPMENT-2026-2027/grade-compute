// src/pages/student/SubjectDetail.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/shared/Sidebar';
import { getDb, saveDb } from '../../utils/db';

export default function SubjectDetail() {
  const { subjectId } = useParams(); // URL parameter (e.g., C101)
  
  // TODO: Initialize database state, handle target grade logic, and render 3-State UI

  return (
    <div className="flex-row" style={{ minHeight: '100vh', gap: 0 }}>
      <Sidebar />
      <main className="container" style={{ padding: '2rem', flex: 1 }}>
        <h2>Subject Workspace (ID: {subjectId})</h2>
        
        {/* Developer implementation for Target Grade Sandbox and Grading Rows goes here */}
        
      </main>
    </div>
  );
}