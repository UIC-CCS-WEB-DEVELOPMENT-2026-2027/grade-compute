import { useState } from 'react';
import GlobalSettings from './pages/GlobalSettings';
import LoginRegister from './pages/auth/LoginRegister';

function App() {
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin) {
    return <LoginRegister onAuthenticated={() => setShowLogin(false)} />;
  }
// Student Workspace
import StudentDashboard from './pages/student/StudentDashboard';
import SubjectDetail from './pages/student/SubjectDetail';
import SubjectMenu from './pages/student/SubjectMenu';
/* PHASE 2
// Professor Workspace
import ProfessorDashboard from './pages/professor/ProfessorDashboard';
import GradingWorkspace from './pages/professor/GradingWorkspace';

  return <GlobalSettings onLogout={() => setShowLogin(true)} />;
}

export default App;
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
