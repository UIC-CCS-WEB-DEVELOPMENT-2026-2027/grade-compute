// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Auth
import LoginRegister from './pages/auth/LoginRegister';

// Global Settings
import GlobalSettings from './pages/GlobalSettings'; // Put this in src/pages/

// Student Workspace
import StudentDashboard from './pages/student/StudentDashboard';
import SubjectDetail from './pages/student/SubjectDetail';
import SubjectMenu from './pages/student/SubjectMenu';
/* PHASE 2
// Professor Workspace
import ProfessorDashboard from './pages/professor/ProfessorDashboard';
import GradingWorkspace from './pages/professor/GradingWorkspace';

// Admin Workspace
import AdminOverview from './pages/admin/AdminOverview';
import RequestQueue from './pages/admin/RequestQueue';
import ManageFaculty from './pages/admin/ManageFaculty';
import ManageCourses from './pages/admin/ManageCourses';
import SystemFormulas from './pages/admin/SystemFormulas';
*/
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public / Authentication */}
        <Route path="/" element={<LoginRegister />} />

        {/* Global Authenticated */}
        <Route path="/settings" element={<GlobalSettings />} />
        
        {/* Student Workspace (Phase 1 Focus) */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/subject" element={<SubjectMenu />} />
        <Route path="/student/subject/:subjectId" element={<SubjectDetail />} />
        {/*
        {// Professor Workspace (Phase 2) }
        <Route path="/professor/classes" element={<ProfessorDashboard />} />
        <Route path="/professor/grading/:classId" element={<GradingWorkspace />} />
        
        {// Admin Workspace (Phase 2) }
        <Route path="/admin/overview" element={<AdminOverview />} />
        <Route path="/admin/requests" element={<RequestQueue />} />
        <Route path="/admin/faculty" element={<ManageFaculty />} />
        <Route path="/admin/courses" element={<ManageCourses />} />
        <Route path="/admin/formulas" element={<SystemFormulas />} />
        */}
        
        {/* Fallback route for unknown URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}