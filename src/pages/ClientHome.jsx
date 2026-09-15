import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import API from '../services/api';

gsap.registerPlugin(ScrollTrigger);

/* Fallback tech items used only when no skills exist in the database yet. */
const fallbackTechItems = [
  { icon: 'HTML', label: 'HTML5' },
  { icon: 'CSS', label: 'CSS3' },
  { icon: 'JS', label: 'JavaScript' },
  { icon: 'RE', label: 'React.js' },
  { icon: 'EX', label: 'Express.js' },
  { icon: 'SQL', label: 'MySQL' },
  { icon: 'GH', label: 'GitHub' },
  { icon: 'VC', label: 'Vercel' },
  { icon: 'AI', label: 'AI Tools' },
];

/* Derive a short icon label from a skill name for the marquee chips. */
const knownIcons = {
  html: 'HTML', html5: 'HTML',
  css: 'CSS', css3: 'CSS',
  javascript: 'JS', js: 'JS',
  typescript: 'TS', ts: 'TS',
  react: 'RE', reactjs: 'RE', 'react.js': 'RE',
  nextjs: 'NX', 'next.js': 'NX',
  vue: 'VUE', vuejs: 'VUE',
  angular: 'NG',
  node: 'ND', nodejs: 'ND', 'node.js': 'ND',
  express: 'EX', expressjs: 'EX', 'express.js': 'EX',
  mysql: 'SQL', sql: 'SQL',
  postgres: 'PG', postgresql: 'PG',
  mongodb: 'MG', mongo: 'MG',
  redis: 'RD',
  firebase: 'FB',
  tailwind: 'TW', tailwindcss: 'TW',
  bootstrap: 'BS',
  sass: 'SASS', scss: 'SASS',
  git: 'GH', github: 'GH', gitlab: 'GL',
  vercel: 'VC', netlify: 'NF',
  docker: 'DK',
  aws: 'AWS',
  python: 'PY',
  java: 'JV',
  php: 'PHP',
  laravel: 'LV',
  graphql: 'GQL',
  api: 'API',
  rest: 'REST',
  figma: 'FG',
  ai: 'AI',
};

const deriveIcon = (raw) => {
  const name = String(raw || '').trim();
  if (!name) return '•';

  const lower = name.toLowerCase();
  if (knownIcons[lower]) return knownIcons[lower];

  const words = name
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  const word = words[0] || name;
  return word.slice(0, 4).toUpperCase();
};

const socialIcons = {
  github: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
    </svg>
  ),
  linkedin: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
    </svg>
  ),
  instagram: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.281.11-.705.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334" />
    </svg>
  ),
  whatsapp: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
    </svg>
  ),
};

const ClientHome = () => {
  const [projects, setProjects] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [contactInfo, setContactInfo] = useState({});
  const [experience, setExperience] = useState([]);
  const [skills, setSkills] = useState([]);
  const [resume, setResume] = useState(null);
  const [dataReady, setDataReady] = useState(false);

  // Marquee repetition & duration (for infinite loop that fills the viewport)
  const [marqueeRepeat, setMarqueeRepeat] = useState(4);
  const [marqueeDuration, setMarqueeDuration] = useState(28);
  const marqueeSetRef = useRef(null);

  // ---------------- DATA FETCH ----------------
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      const results = await Promise.allSettled([
        API.get('/projects'),
        API.get('/certificates'),
        API.get('/social'),
        API.get('/resume'),
        API.get('/contact'),
        API.get('/experience'),
        API.get('/skills'),
      ]);
      if (!active) return;

      const [
        projectsRes,
        certificatesRes,
        socialRes,
        resumeRes,
        contactRes,
        experienceRes,
        skillsRes,
      ] = results;

      if (projectsRes.status === 'fulfilled') setProjects(Array.isArray(projectsRes.value.data) ? projectsRes.value.data : []);
      if (certificatesRes.status === 'fulfilled') setCertificates(Array.isArray(certificatesRes.value.data) ? certificatesRes.value.data : []);
      if (socialRes.status === 'fulfilled') setSocialLinks(Array.isArray(socialRes.value.data) ? socialRes.value.data : []);
      if (resumeRes.status === 'fulfilled') setResume(resumeRes.value.data || null);
      if (contactRes.status === 'fulfilled') setContactInfo(contactRes.value.data || {});
      if (experienceRes.status === 'fulfilled') setExperience(Array.isArray(experienceRes.value.data) ? experienceRes.value.data : []);
      if (skillsRes.status === 'fulfilled') setSkills(Array.isArray(skillsRes.value.data) ? skillsRes.value.data : []);

      results.forEach((result, index) => {
        if (result.status === 'rejected') console.error(`Portfolio API request ${index + 1} failed:`, result.reason);
      });
      setDataReady(true);
    };
    fetchData();
    return () => { active = false; };
  }, []);

  // ---------------- CUSTOM CURSOR ----------------
  useEffect(() => {
    const finePointer = window.matchMedia('(pointer:fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    const glow = document.querySelector('.cursor-glow');

    if (!finePointer || !dot || !ring || !glow || reduced) return;

    document.body.classList.add('cursor-ready');
    gsap.set([dot, ring, glow], { xPercent: -50, yPercent: -50, opacity: 1 });

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power2.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power2.out' });
    const glowX = gsap.quickTo(glow, 'x', { duration: 0.9, ease: 'power2.out' });
    const glowY = gsap.quickTo(glow, 'y', { duration: 0.9, ease: 'power2.out' });

    const onMove = (e) => {
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
      glowX(e.clientX); glowY(e.clientY);
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const hoverables = document.querySelectorAll('a,button,.project,.skill,.role,.cert');
    const onEnter = () => document.body.classList.add('cursor-hover');
    const onLeave = () => document.body.classList.remove('cursor-hover');
    hoverables.forEach((el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    return () => {
      window.removeEventListener('mousemove', onMove);
      hoverables.forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
      document.body.classList.remove('cursor-ready', 'cursor-hover');
    };
  }, []);

  // ---------------- GSAP MASTER ----------------
  useLayoutEffect(() => {
    if (!dataReady) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanups = [];

    document
      .querySelectorAll('.hero h1, .hero-sub, .hero-actions, .hero-side, .profile-photo-wrap, .pulse')
      .forEach((el) => { el.style.animation = 'none'; });

    const canvas = document.getElementById('matrixCanvas');
    if (canvas) canvas.style.setProperty('display', 'block', 'important');

    // ---------- BACKGROUND PARALLAX ----------
    const bgStage = document.querySelector('.bg-stage');
    let bgMoveHandler = null;
    if (bgStage && !reduced) {
      const bgX = gsap.quickTo(bgStage, 'x', { duration: 1.6, ease: 'power2.out' });
      const bgY = gsap.quickTo(bgStage, 'y', { duration: 1.6, ease: 'power2.out' });

      bgMoveHandler = (e) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        bgX(nx * -14);
        bgY(ny * -14);
      };
      window.addEventListener('mousemove', bgMoveHandler, { passive: true });
      cleanups.push(() => window.removeEventListener('mousemove', bgMoveHandler));
    }

    const ctx = gsap.context(() => {
      // ---------- HERO INTRO ----------
      gsap.set('.hero-code-mark', { opacity: 0, scale: 0.6, rotate: -20 });
      gsap.set('.hero-kicker', { opacity: 0, y: 22 });
      gsap.set('.magnetic-word', { opacity: 0, y: 70, rotateX: -55, transformOrigin: '50% 100%' });
      gsap.set('.hero-sub', { opacity: 0, y: 22 });
      gsap.set('.hero-actions .btn', { opacity: 0, y: 22 });
      gsap.set('.profile-photo-wrap', { opacity: 0, scale: 0.85, rotate: -4 });
      gsap.set('.hero-vector', { opacity: 0, scale: 0.55 });
      gsap.set('.availability', { opacity: 0, y: 14 });
      gsap.set('.hero-side > p', { opacity: 0, y: 14 });
      gsap.set('.scroll-note', { opacity: 0 });
      gsap.set('.hero-meta .meta-cell', { opacity: 0, y: 24 });
      gsap.set('.tech-marquee', { opacity: 0, y: 24 });

      const heroTl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 });
      heroTl
        .to('.hero-code-mark', { opacity: 1, scale: 1, rotate: -3, duration: 0.7 })
        .to('.hero-kicker', { opacity: 1, y: 0, duration: 0.7 }, '-=0.35')
        .to('.magnetic-word', { opacity: 1, y: 0, rotateX: 0, duration: 1.05, stagger: 0.06 }, '-=0.45')
        .to('.hero-sub', { opacity: 1, y: 0, duration: 0.85 }, '-=0.75')
        .to('.hero-actions .btn', { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, '-=0.6')
        .to('.profile-photo-wrap', { opacity: 1, scale: 1, rotate: 0, duration: 1.3 }, '-=1.1')
        .to('.hero-vector', { opacity: 0.48, scale: 1, duration: 1.0, stagger: 0.12 }, '-=1.0')
        .to('.availability', { opacity: 1, y: 0, duration: 0.6 }, '-=0.85')
        .to('.hero-side > p', { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
        .to('.scroll-note', { opacity: 1, duration: 0.6 }, '-=0.45')
        .to('.hero-meta .meta-cell', { opacity: 1, y: 0, duration: 0.7, stagger: 0.09 }, '-=0.4')
        .to('.tech-marquee', { opacity: 1, y: 0, duration: 0.7 }, '-=0.35');

      heroTl.add(() => {
        gsap.to('.profile-photo-wrap', {
          y: -6, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1,
        });
      });

      // ---------- MAGNETIC HERO HEADING ----------
      const heading = document.querySelector('.magnetic-heading');
      const wordEls = heading ? Array.from(heading.querySelectorAll('.magnetic-word')) : [];
      if (heading && wordEls.length) {
        const quicks = wordEls.map((el) => ({
          el,
          x: gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' }),
          y: gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' }),
          depth: Number(el.dataset.depth || 1),
        }));
        const onMove = (e) => {
          const hr = heading.getBoundingClientRect();
          const vy = Math.max(-1, Math.min(1, (e.clientY - (hr.top + hr.height / 2)) / Math.max(180, hr.height)));
          quicks.forEach(({ el, x, y, depth }) => {
            const r = el.getBoundingClientRect();
            const vx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 280));
            x(vx * 4 * depth);
            y((vy * 8 + vx * -3) * depth);
          });
        };
        heading.addEventListener('mousemove', onMove);
        cleanups.push(() => heading.removeEventListener('mousemove', onMove));
      }

      // ---------- FLOATING TEXT ON HOVER ----------
      const splitIntoLetters = (root) => {
        const letters = [];
        const walk = (node) => {
          Array.from(node.childNodes).forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
              const text = child.textContent;
              if (!text || !text.trim()) return;
              const frag = document.createDocumentFragment();
              for (const ch of text) {
                if (ch === ' ' || ch === '\n' || ch === '\t') {
                  frag.appendChild(document.createTextNode(ch));
                } else {
                  const span = document.createElement('span');
                  span.className = 'float-letter';
                  span.textContent = ch;
                  frag.appendChild(span);
                  letters.push(span);
                }
              }
              node.replaceChild(frag, child);
            } else if (
              child.nodeType === Node.ELEMENT_NODE &&
              child.tagName.toLowerCase() !== 'svg' &&
              !child.classList.contains('float-letter') &&
              !child.closest('svg')
            ) {
              walk(child);
            }
          });
        };
        walk(root);
        return letters;
      };

      const attachFloatHover = (el) => {
        if (el.dataset.floatReady === 'true') return;
        el.dataset.floatReady = 'true';

        const letters = splitIntoLetters(el);
        if (!letters.length) return;

        let wave = null;
        const onEnter = () => {
          if (wave) wave.kill();
          wave = gsap.to(letters, {
            y: -8,
            duration: 0.55,
            ease: 'sine.inOut',
            stagger: { each: 0.022, yoyo: true, repeat: -1 },
            overwrite: 'auto',
          });
        };
        const onLeave = () => {
          if (wave) { wave.kill(); wave = null; }
          gsap.to(letters, {
            y: 0,
            duration: 0.45,
            ease: 'expo.out',
            stagger: 0.008,
            overwrite: 'auto',
          });
        };

        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
        cleanups.push(() => {
          el.removeEventListener('mouseenter', onEnter);
          el.removeEventListener('mouseleave', onLeave);
          if (wave) wave.kill();
          gsap.set(letters, { clearProps: 'transform' });
        });
      };

      document
        .querySelectorAll(
          '.section-head h2, .project h3, .cert h3, .role h3, .about-lead, .resume h2, .contact h2',
        )
        .forEach(attachFloatHover);

      // ---------- PARALLAX ----------
      [['.hero-vector-left', { y: -60, x: -14, rotate: -14 }],
       ['.hero-vector-right', { y: -70, x: 14, rotate: 14 }],
       ['.profile-glow', { y: -20, scale: 1.35, opacity: 0.4 }],
       ['.hero-code-mark', { y: -40, rotate: -14 }]].forEach(([sel, vars]) => {
        if (!document.querySelector(sel)) return;
        gsap.to(sel, {
          ...vars,
          ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 },
        });
      });
      if (document.querySelector('.about-vector')) {
        gsap.to('.about-vector', { y: -60, ease: 'none', scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
      }
      if (document.querySelector('.contact-vector')) {
        gsap.to('.contact-vector', { y: -50, x: 20, ease: 'none', scrollTrigger: { trigger: '#contact', start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
      }

      // ---------- SECTION REVEALS ----------
      gsap.utils.toArray('section:not(.hero) .section-head').forEach((el) => {
        gsap.from(el, {
          y: 40, opacity: 0, duration: 1.0, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
        });
      });

      const batch = (sel, vars) => {
        if (!document.querySelector(sel)) return;
        ScrollTrigger.batch(sel, {
          start: 'top 90%', once: true,
          onEnter: (b) => gsap.from(b, { ...vars, stagger: 0.1, ease: 'expo.out', overwrite: true }),
        });
      };
      batch('.project', { y: 70, opacity: 0, scale: 0.97, duration: 1.0 });
      batch('.role', { y: 45, opacity: 0, duration: 0.85 });
      batch('.cert', { y: 45, opacity: 0, scale: 0.96, duration: 0.85 });

      // ---------- SKILLS: bar fill + percentage counter ----------
      document.querySelectorAll('.skill').forEach((skill) => {
        const fill = skill.querySelector('.skill-fill');
        const percentEl = skill.querySelector('.skill-percent');
        const level = Number(fill?.dataset.level || 0);
        if (!fill || !percentEl) return;

        gsap.fromTo(skill,
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out',
            scrollTrigger: { trigger: skill, start: 'top 90%', once: true }
          });

        gsap.fromTo(fill,
          { width: '0%' },
          { width: `${level}%`, duration: 1.5, ease: 'expo.out', delay: 0.1,
            scrollTrigger: { trigger: skill, start: 'top 88%', once: true }
          });

        const counter = { val: 0 };
        gsap.to(counter, {
          val: level,
          duration: 1.5,
          ease: 'expo.out',
          delay: 0.1,
          scrollTrigger: { trigger: skill, start: 'top 88%', once: true },
          onUpdate: () => {
            percentEl.textContent = `${Math.round(counter.val)}%`;
          },
        });
      });

      const resumeEl = document.querySelector('.resume');
      if (resumeEl) {
        gsap.from(resumeEl, { y: 45, opacity: 0, duration: 0.95, ease: 'expo.out', scrollTrigger: { trigger: resumeEl, start: 'top 88%' } });
      }
      const contactGrid = document.querySelector('.contact-grid');
      if (contactGrid) {
        gsap.from(contactGrid.children, { y: 45, opacity: 0, duration: 0.95, stagger: 0.14, ease: 'expo.out', scrollTrigger: { trigger: contactGrid, start: 'top 88%' } });
      }

      // ---------- 3D TILT ----------
      const tilt = (el, sx, sy) => {
        const onMove = (e) => {
          const r = el.getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
          const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
          gsap.to(el, {
            rotateY: dx * sx, rotateX: -dy * sy,
            transformPerspective: 1100, transformOrigin: 'center',
            duration: 0.55, ease: 'power2.out', overwrite: 'auto',
          });
        };
        const onLeave = () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.9, ease: 'expo.out', overwrite: 'auto' });
        el.addEventListener('mousemove', onMove);
        el.addEventListener('mouseleave', onLeave);
        cleanups.push(() => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); });
      };
      document.querySelectorAll('.project').forEach((c) => tilt(c, 4.5, 4.5));
      const photoWrap = document.querySelector('.profile-photo-wrap');
      if (photoWrap) tilt(photoWrap, 7, 7);

      // ---------- MAGNETIC BUTTONS ----------
      document.querySelectorAll('.btn, .nav-cta, .contact-link').forEach((btn) => {
        const onMove = (e) => {
          const r = btn.getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
          const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
          gsap.to(btn, { x: dx * 3.5, y: dy * 3.5, duration: 0.45, ease: 'power2.out', overwrite: 'auto' });
        };
        const onLeave = () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
        btn.addEventListener('mousemove', onMove);
        btn.addEventListener('mouseleave', onLeave);
        cleanups.push(() => { btn.removeEventListener('mousemove', onMove); btn.removeEventListener('mouseleave', onLeave); });
      });

      // ---------- TECH MARQUEE pause on hover ----------
      const marqueeWrap = document.querySelector('.tech-marquee');
      const marqueeTrack = document.querySelector('.tech-track');
      if (marqueeWrap && marqueeTrack) {
        const onEnter = () => { marqueeTrack.style.animationPlayState = 'paused'; };
        const onLeave = () => { marqueeTrack.style.animationPlayState = 'running'; };
        marqueeWrap.addEventListener('mouseenter', onEnter);
        marqueeWrap.addEventListener('mouseleave', onLeave);
        cleanups.push(() => {
          marqueeWrap.removeEventListener('mouseenter', onEnter);
          marqueeWrap.removeEventListener('mouseleave', onLeave);
          marqueeTrack.style.animationPlayState = '';
        });
      }
    });

    // ---------------- PARTICLE NETWORK ----------------
    let tickerHandler = null;
    let resizeHandler = null;
    if (canvas && !reduced) {
      const c2d = canvas.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let w = 0, h = 0, particles = [];
      const mouse = { x: -9999, y: -9999, radius: 150 };

      const createParticle = () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.85,
        vy: (Math.random() - 0.5) * 0.85,
        r: 0.8 + Math.random() * 1.6,
        baseAlpha: 0.25 + Math.random() * 0.45,
        pulse: Math.random() * Math.PI * 2,
      });

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        w = rect.width; h = rect.height;
        canvas.width = Math.max(1, Math.floor(w * dpr));
        canvas.height = Math.max(1, Math.floor(h * dpr));
        c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      const initParticles = () => {
        const count = Math.min(180, Math.max(80, Math.floor((w * h) / 12000)));
        particles = Array.from({ length: count }, createParticle);
      };
      resize();
      initParticles();

      const onMoveMouse = (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      };
      const onLeaveMouse = () => { mouse.x = -9999; mouse.y = -9999; };
      window.addEventListener('mousemove', onMoveMouse, { passive: true });
      window.addEventListener('mouseleave', onLeaveMouse);

      const CONNECT_DIST = 120;
      const CONNECT_DIST_SQ = CONNECT_DIST * CONNECT_DIST;

      tickerHandler = () => {
        c2d.clearRect(0, 0, w, h);
        for (let i = 0; i < particles.length; i += 1) {
          const p = particles[i];
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mDistSq = mdx * mdx + mdy * mdy;
          if (mDistSq < mouse.radius * mouse.radius && mDistSq > 0.01) {
            const mDist = Math.sqrt(mDistSq);
            const force = (mouse.radius - mDist) / mouse.radius;
            p.vx += (mdx / mDist) * force * 0.35;
            p.vy += (mdy / mDist) * force * 0.35;
          }
          p.x += p.vx; p.y += p.vy;
          p.vx *= 0.993; p.vy *= 0.993;
          p.pulse += 0.02;

          const speedSq = p.vx * p.vx + p.vy * p.vy;
          if (speedSq < 0.04) {
            const angle = Math.random() * Math.PI * 2;
            const bump = 0.15 + Math.random() * 0.2;
            p.vx += Math.cos(angle) * bump;
            p.vy += Math.sin(angle) * bump;
          }

          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10;
          if (p.y > h + 10) p.y = -10;
        }
        c2d.lineWidth = 0.7;
        for (let i = 0; i < particles.length; i += 1) {
          for (let j = i + 1; j < particles.length; j += 1) {
            const a = particles[i], b = particles[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dSq = dx * dx + dy * dy;
            if (dSq < CONNECT_DIST_SQ) {
              const alpha = (1 - dSq / CONNECT_DIST_SQ) * 0.28;
              c2d.strokeStyle = `rgba(199,255,73,${alpha})`;
              c2d.beginPath();
              c2d.moveTo(a.x, a.y);
              c2d.lineTo(b.x, b.y);
              c2d.stroke();
            }
          }
        }
        c2d.globalCompositeOperation = 'lighter';
        for (let i = 0; i < particles.length; i += 1) {
          const p = particles[i];
          const pulsed = 0.75 + Math.sin(p.pulse) * 0.25;
          const alpha = p.baseAlpha * pulsed;
          const grad = c2d.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          grad.addColorStop(0, `rgba(199,255,73,${alpha})`);
          grad.addColorStop(1, 'rgba(199,255,73,0)');
          c2d.fillStyle = grad;
          c2d.beginPath();
          c2d.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          c2d.fill();
        }
        c2d.globalCompositeOperation = 'source-over';
      };

      gsap.ticker.add(tickerHandler);
      resizeHandler = () => { resize(); initParticles(); };
      window.addEventListener('resize', resizeHandler);
      cleanups.push(() => {
        window.removeEventListener('mousemove', onMoveMouse);
        window.removeEventListener('mouseleave', onLeaveMouse);
      });
    }

    const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 250);
    cleanups.push(() => window.clearTimeout(refreshId));

    return () => {
      cleanups.forEach((fn) => fn());
      if (tickerHandler) gsap.ticker.remove(tickerHandler);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [dataReady, skills.length]);

  // ---------------- Marquee measurement (repeat count + duration) ----------------
  const marqueeItems = useMemo(() => {
    if (skills.length > 0) {
      return skills.map((s) => ({ key: `s-${s.id}`, icon: deriveIcon(s.name), label: s.name }));
    }
    return fallbackTechItems.map((t) => ({ key: `f-${t.icon}`, icon: t.icon, label: t.label }));
  }, [skills]);

  useLayoutEffect(() => {
    if (!marqueeItems.length) return;

    const measure = () => {
      const setEl = marqueeSetRef.current;
      if (!setEl) return;
      const setWidth = setEl.getBoundingClientRect().width;
      if (setWidth < 20) return;

      const viewport = window.innerWidth;
      // How many copies of the set are needed to fill the viewport, +1 for safety
      const needed = Math.max(1, Math.ceil(viewport / setWidth) + 1);
      setMarqueeRepeat((prev) => (prev === needed ? prev : needed));

      // Total group width = one set × needed. Keep visual speed consistent.
      const groupWidth = setWidth * needed;
      const speed = 75; // px per second
      const dur = Math.max(18, groupWidth / speed);
      setMarqueeDuration((prev) => (Math.abs(prev - dur) > 0.5 ? dur : prev));
    };

    measure();
    const t1 = window.setTimeout(measure, 150);
    const t2 = window.setTimeout(measure, 500);
    window.addEventListener('resize', measure);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', measure);
    };
  }, [marqueeItems]);

  // ---------------- DERIVED ----------------
  const hasContact = Boolean(contactInfo?.email || contactInfo?.phone || contactInfo?.address || socialLinks.length);
  const profileImage = contactInfo?.profile_image_url || '/abdulrahman.png';
  const formattedSocialLinks = useMemo(() => socialLinks.filter((l) => l?.url && l?.platform), [socialLinks]);

  // ---------------- JSX ----------------
  return (
    <>
      {/* Fixed full-page background: ambient glow + grid + particles */}
      <div className="bg-stage" aria-hidden="true">
        <div className="page-bg" />
        <canvas id="matrixCanvas" />
      </div>

      <a className="skip-link" href="#main">Skip to content</a>

      <header className="nav-wrap">
        <div className="site-shell">
          <nav aria-label="Primary navigation">
            <a className="brand" href="#top" aria-label="Abdulrahman Awan home">
              <span className="brand-mark">AA</span>
              <span>Abdulrahman Awan</span>
            </a>
            <div className="nav-links">
              {projects.length > 0 && <a href="#work">Work</a>}
              <a href="#about">About</a>
              {experience.length > 0 && <a href="#experience">Experience</a>}
              {certificates.length > 0 && <a href="#certificates">Certificates</a>}
              {resume?.file_url && <a href="#resume">Resume</a>}
              {hasContact && <a href="#contact">Contact</a>}
            </div>
            <div className="nav-tools">
              {hasContact ? (
                <a className="nav-cta" href="#contact">Let&apos;s talk <span>↗</span></a>
              ) : (
                <a className="nav-cta" href="#about">About me <span>↓</span></a>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main id="main">
        <div id="top" className="site-shell">
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-grid">
              <div>
                <div className="hero-code-mark" aria-hidden="true">&lt;/&gt;</div>
                <div className="hero-kicker eyebrow">Full Stack Web Developer</div>
                <h1 id="hero-title" className="magnetic-heading" aria-label="I build web experiences that work.">
                  <span className="magnetic-word" data-depth="0.7">I</span>{' '}
                  <span className="magnetic-word" data-depth="1.0">build</span>{' '}
                  <span className="magnetic-word" data-depth="1.15">web</span>{' '}
                  <span className="magnetic-word" data-depth="0.9">experiences</span>{' '}
                  <span className="magnetic-word" data-depth="0.75">that</span>{' '}
                  <span className="magnetic-word accent" data-depth="1.25">work.</span>
                </h1>
                <p className="hero-sub">I&apos;m Abdulrahman Awan — a full stack web developer focused on clean interfaces, practical products, and reliable web systems.</p>
                <div className="hero-actions">
                  {projects.length > 0 && (
                    <a className="btn btn-primary" href="#work">View selected work <span aria-hidden="true">↗</span></a>
                  )}
                  <a className="btn btn-ghost" href={hasContact ? '#contact' : '#about'}>{hasContact ? 'Get in touch' : 'About me'}</a>
                </div>
              </div>

              <aside className="hero-side" aria-label="Profile and current status">
                <div className="profile-photo-wrap">
                  <div className="hero-vector hero-vector-left" aria-hidden="true">
                    <svg viewBox="0 0 120 180" role="presentation">
                      <path d="M76 12 22 66l54 54" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M94 42 66 70l28 28" fill="none" stroke="currentColor" strokeWidth="1" opacity=".55" />
                      <circle cx="22" cy="66" r="3" fill="currentColor" />
                      <circle cx="76" cy="12" r="3" fill="currentColor" opacity=".7" />
                    </svg>
                  </div>
                  <div className="hero-vector hero-vector-right" aria-hidden="true">
                    <svg viewBox="0 0 120 180" role="presentation">
                      <path d="M44 12 98 66l-54 54" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M26 42 54 70 26 98" fill="none" stroke="currentColor" strokeWidth="1" opacity=".55" />
                      <circle cx="98" cy="66" r="3" fill="currentColor" />
                      <circle cx="44" cy="12" r="3" fill="currentColor" opacity=".7" />
                    </svg>
                  </div>
                  <div className="profile-glow" aria-hidden="true" />
                  <div className="profile-upload-shell">
                    <img
                      id="profilePhoto"
                      className="profile-photo"
                      src={profileImage}
                      alt="Abdulrahman Awan profile"
                      onError={(event) => {
                        if (event.currentTarget.dataset.fallbackApplied) return;
                        event.currentTarget.dataset.fallbackApplied = 'true';
                        event.currentTarget.src = '/abdulrahman.png';
                      }}
                    />
                  </div>
                </div>
                <div className="availability"><span className="pulse" aria-hidden="true" /> Available for opportunities</div>
                <p>React on the front end. Express on the back end. MySQL underneath. Built, shipped and deployed with Git, GitHub and Vercel — with AI used as a development tool, not a substitute for engineering.</p>
                <div className="scroll-note">Scroll to explore</div>
              </aside>
            </div>

            <div className="hero-meta" aria-label="Core technologies">
              <div className="meta-cell"><span className="meta-label">Frontend</span><span className="meta-value">HTML · CSS · JavaScript · React</span></div>
              <div className="meta-cell"><span className="meta-label">Backend</span><span className="meta-value">Express.js · MySQL</span></div>
              <div className="meta-cell"><span className="meta-label">Ship / Workflow</span><span className="meta-value">Git · GitHub · Vercel · AI tools</span></div>
            </div>

            {/* FULL-BLEED TECH MARQUEE — always scrolls, always loops */}
            <div className="tech-marquee" aria-label="Technology stack">
              <div
                className="tech-track"
                style={{ animationDuration: `${marqueeDuration}s` }}
              >
                {[0, 1].map((half) => (
                  <div
                    className="tech-set-group"
                    key={half}
                    aria-hidden={half === 1 ? 'true' : undefined}
                  >
                    {Array.from({ length: marqueeRepeat }).map((_, i) => (
                      <div
                        className="tech-set"
                        key={i}
                        ref={half === 0 && i === 0 ? marqueeSetRef : undefined}
                      >
                        {marqueeItems.map((item) => (
                          <span className="tech-item" key={`${half}-${i}-${item.key}`}>
                            <span className="tech-icon">{item.icon}</span>{item.label}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {projects.length > 0 && (
            <section id="work" aria-labelledby="work-title">
              <div className="section-head">
                <div><div className="eyebrow">Selected work</div><h2 id="work-title">Things I&apos;ve built.</h2></div>
                <span className="section-index">01 / WORK</span>
              </div>
              <div className="work-grid">
                {projects.map((project) => {
                  const techTags = String(project.tech_stack || '').split(',').map((t) => t.trim()).filter(Boolean);
                  return (
                    <article className="project" key={project.id}>
                      <div className="project-visual"
                        style={project.image_url ? { backgroundImage: `url("${project.image_url}")`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined}>
                        {!project.image_url && (
                          <div className="visual-browser" aria-hidden="true">
                            <div className="browser-bar"><span className="browser-dot" /><span className="browser-dot" /><span className="browser-dot" /></div>
                            <div className="browser-body">
                              <div><div className="fake-line big" /><div className="fake-line" style={{ width: '55%' }} /><div className="fake-line" style={{ width: '43%', marginTop: '8px' }} /></div>
                              <div className="fake-card"><div className="fake-line" style={{ width: '70%' }} /><div className="fake-line" style={{ width: '90%', marginTop: '8px' }} /><div className="fake-line" style={{ width: '52%', marginTop: '8px' }} /></div>
                              <div className="fake-card"><div className="fake-line" style={{ width: '64%' }} /><div className="fake-line" style={{ width: '83%', marginTop: '8px' }} /></div>
                              <div className="fake-card"><div className="fake-line" style={{ width: '58%' }} /><div className="fake-line" style={{ width: '78%', marginTop: '8px' }} /></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="project-copy">
                        {techTags.length > 0 && (
                          <div className="project-tags">{techTags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
                        )}
                        <h3>{project.title}</h3>
                        {project.description && <p>{project.description}</p>}
                        <div className="project-links">
                          {project.live_url && <a className="project-link" href={project.live_url} target="_blank" rel="noopener noreferrer">Live project <span>↗</span></a>}
                          {project.github_url && <a className="project-link" href={project.github_url} target="_blank" rel="noopener noreferrer">GitHub <span>↗</span></a>}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <section id="about" aria-labelledby="about-title">
            <div className="section-head">
              <div><div className="eyebrow">About me</div><h2 id="about-title">How I work.</h2></div>
              <span className="section-index">{projects.length > 0 ? '02 / ABOUT' : '01 / ABOUT'}</span>
            </div>
            <div className="about-grid">
              <div className="about-lead">
                Simple UI. Solid engineering. Useful products.
                <div className="section-vector about-vector" aria-hidden="true">
                  <svg viewBox="0 0 210 118" role="presentation">
                    <path d="M8 98H52L82 68H126L160 34H202" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".65" />
                    <path d="M28 84V58H66V34H108V52H146V20H188" fill="none" stroke="currentColor" strokeWidth="1" opacity=".34" />
                    <circle cx="52" cy="98" r="3" fill="currentColor" />
                    <circle cx="82" cy="68" r="3" fill="currentColor" opacity=".8" />
                    <circle cx="126" cy="68" r="3" fill="currentColor" opacity=".55" />
                    <circle cx="160" cy="34" r="3" fill="currentColor" opacity=".78" />
                    <circle cx="202" cy="34" r="3" fill="currentColor" opacity=".92" />
                    <path d="M188 20l8 0M188 20l0 8" stroke="currentColor" strokeWidth="1" opacity=".5" />
                  </svg>
                </div>
              </div>
              <div className="about-copy">
                <p>I like building interfaces that feel obvious to use and systems that are straightforward to maintain. My work sits between frontend craft and full stack implementation.</p>
                <p>I use AI throughout the development workflow for speed, exploration and debugging, while keeping the final decisions around structure, logic, accessibility and quality in my own hands.</p>

                {skills.length > 0 && (
                  <div className="skills-wrap" aria-label="Technology stack">
                    {skills.map((s) => (
                      <div className="skill" key={s.id}>
                        <div className="skill-head">
                          <span className="skill-name">{s.name}</span>
                          <span className="skill-percent" aria-hidden="true">0%</span>
                        </div>
                        <div className="skill-bar">
                          <span className="skill-fill" data-level={s.level} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {experience.length > 0 && (
            <section id="experience" aria-labelledby="experience-title">
              <div className="section-head">
                <div><div className="eyebrow">Experience</div><h2 id="experience-title">Where I&apos;ve worked.</h2></div>
                <span className="section-index">{projects.length > 0 ? '03 / EXPERIENCE' : '02 / EXPERIENCE'}</span>
              </div>
              <div className="timeline">
                {experience.map((exp) => (
                  <article className="role" key={exp.id}>
                    <div className="role-date">{exp.start_date || '—'} — {exp.end_date || 'Present'}</div>
                    <div>
                      <h3>{exp.role_title}</h3>
                      {exp.company && <div className="role-company">{exp.company}</div>}
                      {exp.description && <p>{exp.description}</p>}
                    </div>
                    {exp.type && <div className="role-type">{exp.type}</div>}
                  </article>
                ))}
              </div>
            </section>
          )}

          {certificates.length > 0 && (
            <section id="certificates" aria-labelledby="certificates-title">
              <div className="section-head">
                <div><div className="eyebrow">Certificates</div><h2 id="certificates-title">Proof of learning.</h2></div>
                <span className="section-index">{projects.length > 0 ? '04 / CERTIFICATES' : '02 / CERTIFICATES'}</span>
              </div>
              <div className="cert-grid">
                {certificates.map((cert, index) => (
                  <article className="cert" key={cert.id}>
                    <div className="cert-top">
                      <span className="cert-badge">{String(index + 1).padStart(2, '0')}</span>
                      <span className="cert-year">{cert.issue_date ? new Date(cert.issue_date).getFullYear() : 'N/A'}</span>
                    </div>
                    {cert.image_url && (
                      <div className="cert-image-wrap">
                        <img src={cert.image_url} alt={`${cert.title} certificate`} className="cert-image" loading="lazy" />
                      </div>
                    )}
                    <div>
                      <h3>{cert.title}</h3>
                      {cert.issuer && <p>{cert.issuer}</p>}
                      {cert.certificate_url && (
                        <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer" className="project-link" style={{ marginTop: '9px' }}>
                          View certificate <span>↗</span>
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {resume?.file_url && (
            <section id="resume" aria-labelledby="resume-title">
              <div className="resume">
                <div>
                  <h2 id="resume-title">Need the full story?</h2>
                  <p>My resume covers the complete experience, skills, projects and learning journey in one place.</p>
                </div>
                <a className="btn btn-primary" href={resume.file_url} target="_blank" rel="noopener noreferrer">View resume <span aria-hidden="true">↗</span></a>
              </div>
            </section>
          )}

          {hasContact && (
            <section id="contact" className="contact" aria-labelledby="contact-title">
              <div className="contact-grid">
                <div>
                  <div className="eyebrow">Get in touch</div>
                  <h2 id="contact-title">Have a project in mind? <span>Let&apos;s build it.</span></h2>
                </div>
                <div className="contact-side">
                  <div className="section-vector contact-vector" aria-hidden="true">
                    <svg viewBox="0 0 235 128" role="presentation">
                      <path d="M6 94C32 94 34 48 60 48C86 48 86 88 112 88C138 88 138 30 166 30C192 30 196 64 229 64" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".62" />
                      <path d="M6 110H70L88 92H142L160 74H229" fill="none" stroke="currentColor" strokeWidth="1" opacity=".28" />
                      <circle cx="60" cy="48" r="3" fill="currentColor" />
                      <circle cx="112" cy="88" r="3" fill="currentColor" opacity=".8" />
                      <circle cx="166" cy="30" r="3" fill="currentColor" opacity=".72" />
                      <circle cx="229" cy="64" r="3" fill="currentColor" opacity=".9" />
                      <path d="M210 22h19v19" fill="none" stroke="currentColor" strokeWidth="1" opacity=".42" />
                    </svg>
                  </div>
                  {(contactInfo.email || contactInfo.phone || contactInfo.address) && (
                    <p>
                      {contactInfo.email && (<>Email: {contactInfo.email}<br /></>)}
                      {contactInfo.phone && (<>Phone: {contactInfo.phone}<br /></>)}
                      {contactInfo.address && <>Based in {contactInfo.address}</>}
                    </p>
                  )}
                  <div className="contact-links">
                    {contactInfo.email && <a className="contact-link" href={`mailto:${contactInfo.email}`}>Email ↗</a>}
                    {contactInfo.phone && <a className="contact-link" href={`tel:${contactInfo.phone.replace(/[^\d+]/g, '')}`}>Call ↗</a>}
                    {formattedSocialLinks.map((link) => {
                      const platform = String(link.platform).toLowerCase();
                      const icon = socialIcons[platform];
                      return (
                        <a className="contact-link" key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">
                          {icon}<span>{link.platform}</span><span aria-hidden="true">↗</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <div className="site-shell">
        <footer>
          <span>© {new Date().getFullYear()} Abdulrahman Awan</span>
          <span className="footer-credit">
            Developed by{' '}
            <a
              href="https://www.linkedin.com/in/abdulrahman-awan-5184aa373/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Abdulrahman
              <svg className="footer-heart" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 21s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6.5 5.5 5.5 0 0 1 21.5 12C19 16.65 12 21 12 21z"
                  fill="currentColor"
                />
              </svg>
            </a>
          </span>
        </footer>
      </div>

      <div className="cursor-glow" aria-hidden="true" />
      <div className="cursor-dot" aria-hidden="true" />
      <div className="cursor-ring" aria-hidden="true" />
    </>
  );
};

export default ClientHome;