import { Link } from 'react-router-dom';

export default function SubjectCard({ classId, subjectCode, subjectName, professorName }) {
  return (
    <div className="flex-col justify-between" style={{ border: '1px solid var(--color-border)', padding: '1.5rem', borderRadius: '8px', backgroundColor: 'var(--color-surface)', height: '100%' }}>
      <div>
        <h3 style={{ margin: 0 }}>{subjectCode}</h3>
        <p className="text-official" style={{ marginBottom: '0.5rem' }}>{subjectName}</p>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>Prof: {professorName}</p>
      </div>
      
      <Link
        to={`/student/subject/${classId}`}
        className="dashboard-view-button"
        style={{ marginTop: '1rem' }}
      >
        <span>View Grades</span>
        {/* Decorative chevron; the whole control is a navigation link. */}
        <span className="dashboard-view-chevron" aria-hidden="true" />
      </Link>
    </div>
  );
}