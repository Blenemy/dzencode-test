export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'system-ui, sans-serif',
        color: '#3d4b55',
        background: '#f0f3f5',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#8bc34a', fontWeight: 700, letterSpacing: 1 }}>INVENTORY</p>
        <h1 style={{ fontWeight: 600 }}>Приходы и продукты</h1>
        <p>Приложение в разработке.</p>
      </div>
    </main>
  );
}
