import { useState, useEffect, useRef } from 'react'
import { Button, Alert, Badge, Breadcrumb, ButtonGroup } from '@tutors.plus/design-system'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const badgeRef = useRef(null);

  // Debugging: Log computed styles for badges
  useEffect(() => {
    if (badgeRef.current) {
      setTimeout(() => {
        const badges = badgeRef.current.querySelectorAll('.plus-badge');
        console.group('Badge Styling Debug');
        badges.forEach((badge, index) => {
          const style = window.getComputedStyle(badge);
          const classList = badge.className;
          if (index < 3) {
            console.log(`Badge [${badge.innerText}]:`, {
              backgroundColor: style.backgroundColor,
              color: style.color,
              padding: style.padding,
            });
          }
        });
        console.groupEnd();
      }, 500);
    }
  }, []);

  // Style tokens for consistent spacing
  const sectionStyle = {
    marginBottom: '48px',
    padding: '32px',
    borderRadius: 'var(--size-section-radius-md)',
    border: '1px solid var(--color-outline-variant)',
    backgroundColor: 'var(--color-surface-container-low)',
  };

  const subsectionStyle = {
    marginBottom: '32px',
  };

  const rowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  };

  return (
    <div style={{
      padding: '48px',
      minHeight: '100vh',
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-on-surface)',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ marginBottom: '48px', color: 'var(--color-primary-text)' }}>Design System Consumer Test</h1>

      {/* BUTTONS SECTION */}
      <section style={sectionStyle}>
        <h2 style={{ marginBottom: '24px' }}>Buttons</h2>
        <div style={rowStyle}>
          <Button style="primary" onClick={() => setCount(c => c + 1)}>Primary (Count: {count})</Button>
          <Button style="secondary">Secondary</Button>
          <Button style="success">Success</Button>
          <Button style="danger">Danger</Button>
          <Button style="primary" fill="outline">Outline Primary</Button>
        </div>
      </section>

      {/* BADGES SECTION - Organized into 3 groups */}
      <section style={sectionStyle} ref={badgeRef}>
        <h2 style={{ marginBottom: '32px' }}>Badges Gallery</h2>

        {/* GROUP 1: All Sizes */}
        <div style={subsectionStyle}>
          <h4 style={{ marginBottom: '16px', color: 'var(--color-secondary-text)' }}>1. Size Variations</h4>
          <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
            Badges are available in both Header (h1-h6) and Body (b1-b3) scales.
          </p>

          {/* Headers Row */}
          <div style={rowStyle}>
            <Badge text="H1 Large" size="h1" style="primary" />
            <Badge text="H2" size="h2" style="primary" />
            <Badge text="H3" size="h3" style="primary" />
          </div>

          {/* Titles Row */}
          <div style={rowStyle}>
            <Badge text="H4 Title" size="h4" style="secondary" />
            <Badge text="H5" size="h5" style="secondary" />
            <Badge text="H6" size="h6" style="secondary" />
          </div>

          {/* Body Row */}
          <div style={rowStyle}>
            <Badge text="B1 Body" size="b1" style="tertiary" />
            <Badge text="B2 (Default)" size="b2" style="tertiary" />
            <Badge text="B3 Small" size="b3" style="tertiary" />
          </div>
        </div>

        {/* GROUP 2: All Colors */}
        <div style={subsectionStyle}>
          <h4 style={{ marginBottom: '16px', color: 'var(--color-secondary-text)' }}>2. Color Themes</h4>

          {/* System Colors */}
          <div style={rowStyle}>
            <Badge text="Primary" style="primary" />
            <Badge text="Secondary" style="secondary" />
            <Badge text="Tertiary" style="tertiary" />
            <Badge text="Success" style="success" />
            <Badge text="Warning" style="warning" />
            <Badge text="Danger" style="danger" />
            <Badge text="Info" style="info" />
          </div>

          {/* SMART Colors */}
          <div style={rowStyle}>
            <Badge text="Social-Emotional" style="social-emotional" />
            <Badge text="Mastering Content" style="mastering-content" />
            <Badge text="Advocacy" style="advocacy" />
            <Badge text="Relationship" style="relationship" />
            <Badge text="Technology Tools" style="technology-tools" />
          </div>
        </div>

        {/* GROUP 3: Controls & Features */}
        <div style={subsectionStyle}>
          <h4 style={{ marginBottom: '16px', color: 'var(--color-secondary-text)' }}>3. Controls & Features</h4>

          {/* With Icons */}
          <p style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>With Leading Icons:</p>
          <div style={rowStyle}>
            <Badge text="Success" style="success" leadingVisual={<i className="fa-solid fa-check"></i>} />
            <Badge text="Warning" style="warning" leadingVisual={<i className="fa-solid fa-triangle-exclamation"></i>} />
            <Badge text="Error" style="danger" leadingVisual={<i className="fa-solid fa-circle-exclamation"></i>} />
            <Badge text="User" style="info" leadingVisual={<i className="fa-solid fa-user"></i>} />
          </div>

          {/* With Counters */}
          <p style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>With Counters:</p>
          <div style={rowStyle}>
            <Badge text="Inbox" style="primary" counter="12" />
            <Badge text="Messages" style="secondary" counter="99+" />
            <Badge text="Notifications" style="info" counter="5" />
          </div>

          {/* Dismissible */}
          <p style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>Dismissible:</p>
          <div style={rowStyle}>
            <Badge text="Filter Active" style="primary" dismissible onDismiss={() => console.log('dismissed')} />
            <Badge text="Jane Doe" style="secondary" dismissible leadingVisual={<i className="fa-solid fa-user"></i>} />
            <Badge text="Remove Me" style="danger" dismissible />
          </div>
        </div>
      </section>

      {/* ALERTS SECTION */}
      <section style={sectionStyle}>
        <h2 style={{ marginBottom: '24px' }}>Alerts</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Alert style="info" title="Info Alert" dismissable onDismiss={() => console.log('closed')}>
            This is an info alert from the design system.
          </Alert>
          <Alert style="warning">Warning: Proceed with caution</Alert>
          <Alert style="danger">Error: Something went wrong</Alert>
          <Alert style="success">Success: Operation completed</Alert>
        </div>
      </section>

      {/* BREADCRUMB SECTION */}
      <section style={sectionStyle}>
        <h2 style={{ marginBottom: '24px' }}>Breadcrumb</h2>
        <Breadcrumb items={[
          { text: 'Home', href: '#' },
          { text: 'Library', href: '#' },
          { text: 'Data', active: true }
        ]} />
      </section>

      {/* BUTTON GROUP SECTION */}
      <section style={sectionStyle}>
        <h2 style={{ marginBottom: '24px' }}>Button Group</h2>
        <ButtonGroup ariaLabel="Basic example">
          <Button style="secondary">Left</Button>
          <Button style="secondary">Middle</Button>
          <Button style="secondary">Right</Button>
        </ButtonGroup>
      </section>
    </div>
  )
}

export default App

