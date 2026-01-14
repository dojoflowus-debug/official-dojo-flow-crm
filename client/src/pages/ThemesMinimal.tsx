export default function ThemesMinimal() {
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Minimal Test Page</h1>
      <p style={{ fontSize: '16px' }}>
        This page has NO imports, NO components, just plain HTML and inline styles.
      </p>
      <p style={{ fontSize: '16px', marginTop: '10px' }}>
        If you can see this text, the route is working and React is rendering correctly.
      </p>
      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        backgroundColor: '#f0f0f0', 
        border: '1px solid #ccc',
        borderRadius: '8px'
      }}>
        <p style={{ fontSize: '14px' }}>This is a test box with inline styles.</p>
      </div>
    </div>
  )
}
