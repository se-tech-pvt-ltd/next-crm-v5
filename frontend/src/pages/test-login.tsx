interface TestLoginProps {
  onLogin: (userData: { id: string; email: string; role: string; branch?: string }) => void;
}

export default function TestLogin({ onLogin }: TestLoginProps) {
  const handleTestLogin = () => {
    onLogin({
      id: "admin1",
      email: "admin@studybridge.com",
      role: "admin_staff"
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>
          StudyBridge CRM - Test Login
        </h1>
        <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
          Click the button below to login as admin
        </p>
        <button 
          onClick={handleTestLogin}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Login as Admin
        </button>
      </div>
    </div>
  );
}
