import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import gsap from 'gsap';
import API from '../services/api';
import { auth, googleProvider } from '../config/firebase';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M21.35 12.2c0-.72-.06-1.42-.19-2.08H12v3.94h5.23a4.47 4.47 0 0 1-1.94 2.93v2.44h3.14c1.84-1.69 2.92-4.19 2.92-7.23Z" />
    <path fill="#34A853" d="M12 21.99c2.63 0 4.84-.87 6.45-2.36l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.55 0-4.7-1.72-5.47-4.04H3.29v2.52A9.75 9.75 0 0 0 12 21.99Z" />
    <path fill="#FBBC05" d="M6.53 14.07a5.86 5.86 0 0 1 0-3.75V7.8H3.29a9.76 9.76 0 0 0 0 8.79l3.24-2.52Z" />
    <path fill="#EA4335" d="M12 6.28c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.37 14.63 2.5 12 2.5a9.75 9.75 0 0 0-8.71 5.3l3.24 2.52C7.3 8 9.45 6.28 12 6.28Z" />
  </svg>
);

const bootLines = (accountLine) => [
  { text: '$ session --check', mono: true },
  { text: 'no active admin session', tone: 'muted' },
  { text: '$ auth google --workspace portfolio-cms', mono: true },
  accountLine
    ? { text: accountLine, tone: 'ok' }
    : { text: 'waiting for sign-in…', tone: 'muted', caret: true },
];

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const panelRef = useRef(null);
  const terminalRef = useRef(null);
  const linesRef = useRef(null);

  // ---------------------------------------------------------
  // AUTH
  // ---------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const response = await API.get('/admin/me');
        if (response.data?.authorized) {
          navigate('/admin/dashboard', { replace: true });
          return;
        }

        await signOut(auth);
        if (mounted) setChecking(false);
      } catch (err) {
        await signOut(auth).catch(() => {});
        if (mounted) {
          setError(
            err.response?.data?.msg ||
              'This Google account is not authorized for admin access.',
          );
          setChecking(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [navigate]);

  // ---------------------------------------------------------
  // GSAP — entrance choreography
  // ---------------------------------------------------------
  useLayoutEffect(() => {
    if (checking) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      // Terminal window scale + rotate in
      if (terminalRef.current) {
        gsap.from(terminalRef.current, {
          y: 40,
          opacity: 0,
          scale: 0.94,
          rotate: -2,
          duration: 1.0,
          ease: 'expo.out',
        });
      }

      // Terminal lines typed in, one after the other
      if (linesRef.current) {
        const lines = linesRef.current.querySelectorAll('.cms-terminal-line');
        gsap.from(lines, {
          opacity: 0,
          x: -14,
          duration: 0.5,
          stagger: 0.18,
          delay: 0.55,
          ease: 'power2.out',
        });
      }

      // Footer note under terminal
      gsap.from('.cms-login-stage-foot', {
        y: 16,
        opacity: 0,
        duration: 0.7,
        delay: 1.35,
        ease: 'expo.out',
      });

      // Right panel — brand + heading + button
      const panelChildren = panelRef.current?.querySelectorAll(
        '.cms-login-brand, h1, p, .cms-google-btn, .cms-error, .cms-login-back',
      );
      if (panelChildren) {
        gsap.from(panelChildren, {
          y: 22,
          opacity: 0,
          duration: 0.7,
          stagger: 0.09,
          delay: 0.25,
          ease: 'expo.out',
        });
      }

      // Subtle ambient pulse on the terminal caret
      const caret = terminalRef.current?.querySelector('.cms-caret');
      if (caret) {
        gsap.to(caret, {
          opacity: 0.25,
          duration: 0.7,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
    }, rootRef);

    return () => ctx.revert();
  }, [checking]);

  // Animate error message when it appears
  useLayoutEffect(() => {
    if (!error) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const el = panelRef.current?.querySelector('.cms-error');
    if (!el) return;
    gsap.fromTo(
      el,
      { y: -8, opacity: 0, scale: 0.98 },
      { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'expo.out' },
    );
  }, [error]);

  // Button micro-interaction via GSAP on top of CSS
  useLayoutEffect(() => {
    if (checking) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const btn = panelRef.current?.querySelector('.cms-google-btn');
    if (!btn) return;

    const onEnter = () =>
      gsap.to(btn, { scale: 1.015, duration: 0.25, ease: 'power2.out' });
    const onLeave = () =>
      gsap.to(btn, { scale: 1, duration: 0.35, ease: 'expo.out' });

    btn.addEventListener('mouseenter', onEnter);
    btn.addEventListener('mouseleave', onLeave);
    return () => {
      btn.removeEventListener('mouseenter', onEnter);
      btn.removeEventListener('mouseleave', onLeave);
    };
  }, [checking]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      await signInWithPopup(auth, googleProvider);
      const response = await API.get('/admin/me');

      if (!response.data?.authorized) {
        await signOut(auth);
        setError('This Google account is not authorized for admin access.');
        return;
      }

      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error('Google admin login error:', err);

      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled.');
      } else if (err.response?.status === 403) {
        setError('This Google account is not authorized for admin access.');
      } else {
        setError(
          err.response?.data?.msg ||
            err.message ||
            'Google login failed. Please try again.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------
  if (checking) {
    return (
      <main className="cms cms-login" ref={rootRef}>
        <div />
        <div className="cms-login-panel">
          <div className="cms-login-loading" aria-live="polite">
            <span className="cms-spinner" />
            <span>Checking your session…</span>
          </div>
        </div>
      </main>
    );
  }

  const lines = bootLines(error ? null : loading ? 'authorizing…' : null);

  return (
    <main className="cms cms-login" ref={rootRef}>
      <section className="cms-login-stage" aria-hidden="true" ref={stageRef}>
        <div className="cms-terminal" ref={terminalRef}>
          <div className="cms-terminal-bar">
            <div className="cms-winbar">
              <span className="cms-dot" />
              <span className="cms-dot" />
              <span className="cms-dot" />
            </div>
            <span className="cms-mono">admin@portfolio-cms</span>
          </div>
          <div className="cms-terminal-body cms-mono" ref={linesRef}>
            {lines.map((line, index) => (
              <div
                key={index}
                className={`cms-terminal-line ${line.tone === 'ok' ? 'ok' : ''}`}
              >
                {line.text}
                {line.caret && <span className="cms-caret" />}
              </div>
            ))}
          </div>
        </div>
        <p className="cms-login-stage-foot">
          This is the workspace behind the portfolio at abdulrahmanawan.dev —
          projects, certificates and experience live here before they show up
          on the public site.
        </p>
      </section>

      <section className="cms-login-panel" ref={panelRef}>
        <a className="cms-login-brand" href="/" aria-label="Back to portfolio">
          <span className="brand-mark">AA</span>
          <span>Abdulrahman Awan</span>
        </a>

        <h1>Sign in to the workspace</h1>
        <p>
          Use your authorized Google account to manage the projects,
          certificates and content shown on your portfolio.
        </p>

        <button
          type="button"
          className="cms-google-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? <span className="cms-spinner dark" /> : <GoogleIcon />}
          <span>{loading ? 'Signing in…' : 'Continue with Google'}</span>
        </button>

        {error && (
          <div className="cms-error" role="alert">
            <i aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <a className="cms-login-back" href="/">
          ← Back to portfolio
        </a>
      </section>
    </main>
  );
};

export default AdminLogin;