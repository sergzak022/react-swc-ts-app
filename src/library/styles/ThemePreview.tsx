import { useState, useEffect } from 'react';

/**
 * ThemePreview — Developer-only page for visual validation of design tokens
 * 
 * Purpose: Preview all CSS variables (surfaces, typography, brand, status,
 * spacing, shadows, controls) in both light and dark themes.
 * 
 * URL: /library/styles/preview
 */
export default function ThemePreview() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Sync with current theme on mount
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
  };

  return (
    <div style={{
      padding: 'var(--space-8)',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      {/* Header with Theme Toggle */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-8)',
        paddingBottom: 'var(--space-4)',
        borderBottom: '2px solid var(--color-border)',
      }}>
        <h1 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--weight-bold)',
          lineHeight: 'var(--line-tight)',
          margin: 0,
        }}>
          Theme Preview
        </h1>
        <button
          onClick={toggleTheme}
          style={{
            backgroundColor: 'var(--color-bg-button)',
            color: 'var(--color-fg-button)',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            padding: 'var(--space-3) var(--space-6)',
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--weight-medium)',
            cursor: 'pointer',
            transition: 'background-color var(--dur-standard) var(--ease-standard)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-button-hover)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-button)';
          }}
        >
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      {/* Surfaces Section */}
      <Section title="Surfaces">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <Swatch label="App Background" cssVar="--color-bg-app" />
          <Swatch label="Surface" cssVar="--color-bg-surface" />
          <Swatch label="Muted" cssVar="--color-bg-muted" />
          <Swatch label="Hover" cssVar="--color-bg-hover" />
          <Swatch label="Active" cssVar="--color-bg-active" />
        </div>
      </Section>

      {/* Typography Section */}
      <Section title="Typography">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextSample text="Primary text" cssVar="--color-fg-primary" size="--text-md" />
          <TextSample text="Muted text" cssVar="--color-fg-muted" size="--text-md" />
          <TextSample text="Disabled text" cssVar="--color-fg-disabled" size="--text-md" />
          <div style={{
            backgroundColor: 'var(--color-brand-primary)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-card)',
          }}>
            <TextSample text="Inverse text on dark background" cssVar="--color-fg-inverse" size="--text-md" />
          </div>
        </div>
        
        <div style={{ marginTop: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)' }}>Size Scale</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ fontSize: 'var(--text-xs)' }}>Extra Small (xs) — 12px</div>
            <div style={{ fontSize: 'var(--text-sm)' }}>Small (sm) — 14px</div>
            <div style={{ fontSize: 'var(--text-md)' }}>Medium (md) — 16px</div>
            <div style={{ fontSize: 'var(--text-lg)' }}>Large (lg) — 18px</div>
            <div style={{ fontSize: 'var(--text-xl)' }}>Extra Large (xl) — 20px</div>
            <div style={{ fontSize: 'var(--text-2xl)' }}>2X Large (2xl) — 24px</div>
          </div>
        </div>
      </Section>

      {/* Borders Section */}
      <Section title="Borders">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <BorderSample label="Default Border" cssVar="--color-border" />
          <BorderSample label="Strong Border" cssVar="--color-border-strong" />
          <BorderSample label="Muted Border" cssVar="--color-border-muted" />
        </div>
      </Section>

      {/* Brand Colors Section */}
      <Section title="Brand Colors">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <ColorBlock label="Primary Brand" cssVar="--color-brand-primary" />
          <ColorBlock label="Secondary Brand" cssVar="--color-brand-secondary" />
        </div>
      </Section>

      {/* Status Colors Section */}
      <Section title="Status Colors">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <StatusBadge label="Success" cssVar="--color-success" bgVar="--color-bg-success" />
          <StatusBadge label="Warning" cssVar="--color-warning" bgVar="--color-bg-warning" />
          <StatusBadge label="Error" cssVar="--color-error" bgVar="--color-bg-error" />
          <StatusBadge label="Info" cssVar="--color-info" bgVar="--color-bg-info" />
        </div>
      </Section>

      {/* Controls Section */}
      <Section title="Controls">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Buttons */}
          <div>
            <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)' }}>Buttons</h3>
            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <button style={{
                backgroundColor: 'var(--color-bg-button)',
                color: 'var(--color-fg-button)',
                border: 'none',
                borderRadius: 'var(--radius-button)',
                padding: 'var(--space-3) var(--space-6)',
                fontSize: 'var(--text-md)',
                fontWeight: 'var(--weight-medium)',
                cursor: 'pointer',
              }}>
                Primary Button
              </button>
              <button style={{
                backgroundColor: 'var(--color-bg-button-secondary)',
                color: 'var(--color-fg-button-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-button)',
                padding: 'var(--space-3) var(--space-6)',
                fontSize: 'var(--text-md)',
                fontWeight: 'var(--weight-medium)',
                cursor: 'pointer',
              }}>
                Secondary Button
              </button>
            </div>
          </div>

          {/* Inputs */}
          <div>
            <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)' }}>Inputs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Text input"
                style={{
                  backgroundColor: 'var(--color-bg-input)',
                  color: 'var(--color-fg-input)',
                  border: '1px solid var(--color-border-input)',
                  borderRadius: 'var(--radius-input)',
                  padding: 'var(--space-3)',
                  fontSize: 'var(--text-md)',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-input-focus)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-input)';
                }}
              />
              <textarea
                placeholder="Textarea"
                rows={3}
                style={{
                  backgroundColor: 'var(--color-bg-input)',
                  color: 'var(--color-fg-input)',
                  border: '1px solid var(--color-border-input)',
                  borderRadius: 'var(--radius-input)',
                  padding: 'var(--space-3)',
                  fontSize: 'var(--text-md)',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-input-focus)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-input)';
                }}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Spacing Section */}
      <Section title="Spacing Scale">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <SpacingExample label="space-0" value="0" />
          <SpacingExample label="space-1" value="0.25rem" />
          <SpacingExample label="space-2" value="0.5rem" />
          <SpacingExample label="space-3" value="0.75rem" />
          <SpacingExample label="space-4" value="1rem" />
          <SpacingExample label="space-6" value="1.5rem" />
          <SpacingExample label="space-8" value="2rem" />
          <SpacingExample label="space-12" value="3rem" />
          <SpacingExample label="space-16" value="4rem" />
        </div>
      </Section>

      {/* Radii Section */}
      <Section title="Border Radius">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-4)' }}>
          <RadiusExample label="sm (4px)" radius="var(--radius-sm)" />
          <RadiusExample label="md (6px)" radius="var(--radius-md)" />
          <RadiusExample label="lg (8px)" radius="var(--radius-lg)" />
          <RadiusExample label="xl (12px)" radius="var(--radius-xl)" />
        </div>
      </Section>

      {/* Shadows Section */}
      <Section title="Shadows (Elevation)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)' }}>
          <ShadowExample label="Card" shadow="var(--elevation-card)" />
          <ShadowExample label="Popover" shadow="var(--elevation-popover)" />
          <ShadowExample label="Dropdown" shadow="var(--elevation-dropdown)" />
          <ShadowExample label="Modal" shadow="var(--elevation-modal)" />
        </div>
      </Section>
    </div>
  );
}

// Helper Components

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 'var(--space-8)' }}>
      <h2 style={{
        fontSize: 'var(--text-xl)',
        fontWeight: 'var(--weight-semibold)',
        marginBottom: 'var(--space-4)',
        paddingBottom: 'var(--space-2)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({ label, cssVar }: { label: string; cssVar: string }) {
  return (
    <div style={{
      backgroundColor: `var(${cssVar})`,
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--space-4)',
      minHeight: '80px',
      display: 'flex',
      alignItems: 'flex-end',
    }}>
      <div style={{
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-medium)',
        color: 'var(--color-fg-primary)',
      }}>
        {label}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-fg-muted)', marginTop: 'var(--space-1)' }}>
          {cssVar}
        </div>
      </div>
    </div>
  );
}

function TextSample({ text, cssVar, size }: { text: string; cssVar: string; size: string }) {
  return (
    <div style={{
      color: `var(${cssVar})`,
      fontSize: `var(${size})`,
    }}>
      {text} <span style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>({cssVar})</span>
    </div>
  );
}

function BorderSample({ label, cssVar }: { label: string; cssVar: string }) {
  return (
    <div style={{
      border: `2px solid var(${cssVar})`,
      borderRadius: 'var(--radius-card)',
      padding: 'var(--space-4)',
      backgroundColor: 'var(--color-bg-surface)',
    }}>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-fg-muted)', marginTop: 'var(--space-1)' }}>
        {cssVar}
      </div>
    </div>
  );
}

function ColorBlock({ label, cssVar }: { label: string; cssVar: string }) {
  return (
    <div style={{
      backgroundColor: `var(${cssVar})`,
      color: 'var(--color-fg-inverse)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--space-4)',
      minHeight: '100px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
    }}>
      <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', opacity: 0.9, marginTop: 'var(--space-1)' }}>
        {cssVar}
      </div>
    </div>
  );
}

function StatusBadge({ label, cssVar, bgVar }: { label: string; cssVar: string; bgVar: string }) {
  return (
    <div style={{
      backgroundColor: `var(${bgVar})`,
      border: `1px solid var(${cssVar})`,
      borderRadius: 'var(--radius-card)',
      padding: 'var(--space-4)',
    }}>
      <div style={{
        color: `var(${cssVar})`,
        fontSize: 'var(--text-md)',
        fontWeight: 'var(--weight-semibold)',
      }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-fg-muted)', marginTop: 'var(--space-1)' }}>
        {cssVar}
      </div>
    </div>
  );
}

function SpacingExample({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div style={{ width: '120px', fontSize: 'var(--text-sm)' }}>
        {label} ({value})
      </div>
      <div
        style={{
          width: `var(--${label})`,
          height: '24px',
          backgroundColor: 'var(--color-brand-primary)',
          borderRadius: 'var(--radius-sm)',
        }}
      />
    </div>
  );
}

function RadiusExample({ label, radius }: { label: string; radius: string }) {
  return (
    <div style={{
      backgroundColor: 'var(--color-brand-primary)',
      color: 'var(--color-fg-inverse)',
      borderRadius: radius,
      padding: 'var(--space-4)',
      textAlign: 'center',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-medium)',
    }}>
      {label}
    </div>
  );
}

function ShadowExample({ label, shadow }: { label: string; shadow: string }) {
  return (
    <div style={{
      backgroundColor: 'var(--color-bg-surface)',
      boxShadow: shadow,
      borderRadius: 'var(--radius-card)',
      padding: 'var(--space-6)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-fg-muted)', marginTop: 'var(--space-2)' }}>
        elevation-{label.toLowerCase()}
      </div>
    </div>
  );
}

