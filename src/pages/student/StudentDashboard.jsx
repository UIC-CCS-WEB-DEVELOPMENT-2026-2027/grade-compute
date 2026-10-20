import Sidebar from '../../components/shared/Sidebar';
import SubjectCard from '../../components/student/SubjectCard';

const subjects = [
  {
    classId: 'C101',
    subjectCode: 'IT101',
    subjectName: 'Computer Systems',
    professorName: 'Prof. Maria Santos',
  },
  {
    classId: 'C102',
    subjectCode: 'MATH 101',
    subjectName: 'General Mathematics',
    professorName: 'Prof. Daniel Reyes',
  },
  {
    classId: 'C103',
    subjectCode: 'PROG 101',
    subjectName: 'Introduction to Programming',
    professorName: 'Prof. Andrea Cruz',
  },
  {
    classId: 'C104',
    subjectCode: 'ANTH 101',
    subjectName: 'Cultural Anthropology',
    professorName: 'Prof. Luis Mendoza',
  },
];

export default function StudentDashboard() {
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