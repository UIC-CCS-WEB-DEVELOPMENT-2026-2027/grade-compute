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
      <main className="container" style={{ flex: 1, padding: '2rem' }}>
        <header>
          <p className="eyebrow">YOUR ACADEMIC SPACE</p>
          <h1>Student Dashboard</h1>
          <p>Review your enrolled subjects and open a class to view its grades.</p>
        </header>

        <section
          aria-label="Enrolled subjects"
          className="flex-row"
          style={{ marginTop: '2rem', alignItems: 'stretch' }}
        >
          {subjects.map((subject) => (
            <div key={subject.classId} style={{ flex: '1 1 240px', minWidth: 0 }}>
              <SubjectCard {...subject} />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}