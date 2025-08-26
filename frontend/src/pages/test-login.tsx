interface TestLoginProps {
  onLogin: (userData: { id: string; email: string; role: string; branch?: string }) => void;
}

export default function TestLogin({ onLogin }: TestLoginProps) {
  console.log('TestLogin component rendering');

  const handleTestLogin = () => {
    console.log('Test login button clicked');
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
      backgroundColor: '#ff0000',  // Red background so we can see it
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        backgroundColor: '#000000',  // Black container for contrast
        color: 'white',
        padding: '2rem',
        border: '2px solid yellow', // Yellow border for visibility
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          🚀 TEST LOGIN PAGE IS WORKING! 🚀
        </h1>
        <p style={{ marginBottom: '2rem', fontSize: '1.2rem' }}>
          If you can see this, the app is rendering correctly!
        </p>
        <button
          onClick={handleTestLogin}
          style={{
            backgroundColor: '#00ff00',  // Bright green button
            color: 'black',
            padding: '1rem 2rem',
            border: '2px solid white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}
        >
          🎯 CLICK TO LOGIN AS ADMIN
        </button>
      </div>
    </div>
  );
}
