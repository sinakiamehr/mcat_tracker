export default function NotFoundScreen() {
  return (
    <div style={{
      display: 'flex',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      minHeight: '100vh'
    }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>This screen doesn't exist.</h1>
        <p style={{ color: '#666', textAlign: 'center' }}>Go back to the home screen!</p>
      </div>
    </div>
  );
}