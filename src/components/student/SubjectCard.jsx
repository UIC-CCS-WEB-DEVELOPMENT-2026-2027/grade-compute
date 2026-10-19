import { Link } from 'react-router-dom';

export default function SubjectCard({ classId, subjectCode, subjectName, professorName }) {
  return (
    <div className="flex-col justify-between" style={{ border: '1px solid var(--color-border)', padding: '1.5rem', borderRadius: '8px', backgroundColor: 'var(--color-surface)', height: '100%' }}>
      <div>
        <h3 style={{ margin: 0 }}>{subjectCode}</h3>
        <p className="text-official" style={{ marginBottom: '0.5rem' }}>{subjectName}</p>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>Prof: {professorName}</p>
      </div>
      
      <Link to={`/student/subject/${classId}`} style={{ textDecoration: 'none', marginTop: '1rem' }}>
        <button className="btn-accent" style={{ width: '100%' }}>View Grades</button>
      </Link>
    </div>
  );
}