import '@tutors.plus/design-system/styles';
import {
  Alert,
  Badge,
  Button,
  Accordion,
  Breadcrumb
} from '@tutors.plus/design-system';

function App() {
  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 className="h1">🔥 Fresh Stress Test</h1>
      <p className="b1">@tutors.plus/design-system v0.1.0-pilot.20</p>
      <hr />

      {/* Breadcrumb */}
      <section style={{ marginBottom: '24px' }}>
        <h2 className="h3">Breadcrumb</h2>
        <Breadcrumb items={[
          { text: "Home", href: "#" },
          { text: "Products", href: "#" },
          { text: "Current Page" }
        ]} />
      </section>

      {/* Alerts */}
      <section style={{ marginBottom: '24px' }}>
        <h2 className="h3">Alerts</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Alert style="success" title="Success!">Operation completed.</Alert>
          <Alert style="info" title="Information">This is an info alert.</Alert>
          <Alert style="warning" title="Warning">Please check this.</Alert>
          <Alert style="danger" title="Error">Something went wrong.</Alert>
        </div>
      </section>

      {/* Badges */}
      <section style={{ marginBottom: '24px' }}>
        <h2 className="h3">Badges</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Badge style="primary">Primary</Badge>
          <Badge style="secondary">Secondary</Badge>
          <Badge style="success">Success</Badge>
          <Badge style="danger">Danger</Badge>
          <Badge style="warning">Warning</Badge>
          <Badge style="info">Info</Badge>
        </div>
      </section>

      {/* Buttons */}
      <section style={{ marginBottom: '24px' }}>
        <h2 className="h3">Buttons</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button style="primary">Primary</Button>
          <Button style="secondary">Secondary</Button>
          <Button style="success">Success</Button>
          <Button style="danger">Danger</Button>
          <Button style="outline-primary">Outline</Button>
          <Button style="link">Link</Button>
        </div>
      </section>

      {/* Accordion */}
      <section style={{ marginBottom: '24px' }}>
        <h2 className="h3">Accordion</h2>
        <Accordion
          defaultActiveKey="0"
          items={[
            { eventKey: "0", header: "First Section", body: "This is the content of the first section." },
            { eventKey: "1", header: "Second Section", body: "This is the content of the second section." },
            { eventKey: "2", header: "Third Section", body: "This is the content of the third section." }
          ]}
        />
      </section>

      <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ccc' }}>
        <p className="b3" style={{ color: '#666' }}>
          ✅ If you see this page with all components rendered, the npm package works!
        </p>
      </footer>
    </div>
  );
}

export default App;
