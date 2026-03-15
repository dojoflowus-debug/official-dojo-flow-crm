import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

function publishHeight(px: number) {
  // Set CSS variable for any listener
  document.documentElement.style.setProperty('--cookie-bar-height', `${px}px`);
  // Also dispatch a custom event for components that listen
  window.dispatchEvent(new CustomEvent('cookie-bar-height', { detail: px }));
}

export function CookieNotice() {
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cookieConsent = localStorage.getItem('dojoflow-cookie-consent');
    if (!cookieConsent) {
      const timer = setTimeout(() => {
        setShow(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Once shown, measure height and publish, then trigger fade-in
  useEffect(() => {
    if (!show) return;
    // Give DOM a frame to render before measuring
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const h = barRef.current?.offsetHeight ?? 42;
        publishHeight(h);
        setVisible(true);
      });
    });
  }, [show]);

  // Update on resize
  useEffect(() => {
    if (!visible) return;
    const update = () => {
      const h = barRef.current?.offsetHeight ?? 42;
      publishHeight(h);
    };
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [visible]);

  const dismiss = (value: 'accepted' | 'declined') => {
    setVisible(false);
    publishHeight(0);
    setTimeout(() => setShow(false), 600);
    localStorage.setItem('dojoflow-cookie-consent', value);
  };

  if (!show) return null;

  return (
    <div
      ref={barRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-4px)',
        transition: 'opacity 700ms ease, transform 700ms ease',
        pointerEvents: visible ? 'auto' : 'none',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      }}
      role="dialog"
      aria-labelledby="cookie-notice-title"
      aria-describedby="cookie-notice-description"
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <p id="cookie-notice-description" style={{ margin: 0, fontSize: '13px', color: '#374151', flex: 1, minWidth: '200px' }}>
          <span id="cookie-notice-title" style={{ fontWeight: 600, color: '#000000' }}>We use cookies</span>
          {' '}to enhance your experience, analyze traffic, and personalize content.{' '}
          <a
            href="/cookies"
            style={{ color: '#000000', textDecoration: 'underline' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more
          </a>
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => dismiss('declined')}
            style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 500, color: '#4b5563', background: 'transparent', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
          >
            Decline
          </button>
          <button
            onClick={() => dismiss('accepted')}
            style={{ padding: '5px 14px', fontSize: '12px', fontWeight: 600, color: '#ffffff', background: '#000000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Accept
          </button>
          <button
            onClick={() => dismiss('declined')}
            style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}
            aria-label="Close cookie notice"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
