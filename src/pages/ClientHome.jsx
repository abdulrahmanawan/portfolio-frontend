import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import API from '../services/api';

gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   Category mapping for skills
   ========================================================= */
const CATEGORY_DEFS = [
  {
    num: '01',
    title: 'Frontend',
    color: '#7C6AFF',
    glow: 'rgba(124,106,255,.18)',
    keys: ['html','css','javascript','js','react','vue','angular','tailwind','bootstrap','sass','scss','next','typescript','ts','styled','redux'],
  },
  {
    num: '02',
    title: 'Backend',
    color: '#4FD1C5',
    glow: 'rgba(79,209,197,.16)',
    keys: ['node','express','laravel','php','python','java','django','flask','ruby','graphql','api','rest','nest'],
  },
  {
    num: '03',
    title: 'Database',
    color: '#FFB066',
    glow: 'rgba(255,176,102,.16)',
    keys: ['mysql','postgres','mongodb','mongo','sql','redis','firebase','maria','schema','query'],
  },
  {
    num: '04',
    title: 'Tools & Deploy',
    color: '#FF6E8C',
    glow: 'rgba(255,110,140,.16)',
    keys: ['git','github','gitlab','vs code','vscode','vercel','netlify','docker','aws','figma','npm','vite','webpack','postman','jira','slack'],
  },
];

const categorizeSkills = (skills) => {
  const cats = CATEGORY_DEFS.map((c) => ({ ...c, items: [] }));
  const others = [];

  skills.forEach((skill) => {
    const name = String(skill.name || '').toLowerCase();
    let placed = false;
    for (const c of cats) {
      if (c.keys.some((k) => name.includes(k))) {
        c.items.push(skill);
        placed = true;
        break;
      }
    }
    if (!placed) others.push(skill);
  });

  if (others.length) cats[3].items.push(...others);

  return cats.filter((c) => c.items.length > 0);
};

/* =========================================================
   Social icon set
   ========================================================= */
const SOCIAL_ICONS = {
  github: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 015.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.42.36.79 1.07.79 2.15v3.19c0 .31.21.68.8.56A11.51 11.51 0 0023.5 12C23.5 5.73 18.27.5 12 .5z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07c-1.28.06-2.15.26-2.92.56a5.88 5.88 0 00-2.13 1.39A5.88 5.88 0 00.6 4.15C.3 4.92.1 5.79.04 7.07.02 8.34 0 8.75 0 12s.01 3.66.07 4.94c.06 1.28.26 2.15.56 2.92.3.79.72 1.46 1.39 2.13.67.67 1.34 1.09 2.13 1.39.77.3 1.64.5 2.92.56 1.28.06 1.69.07 4.94.07s3.66-.01 4.94-.07c1.28-.06 2.15-.26 2.92-.56a5.88 5.88 0 002.13-1.39 5.88 5.88 0 001.39-2.13c.3-.77.5-1.64.56-2.92.06-1.28.07-1.69.07-4.94s-.01-3.66-.07-4.94c-.06-1.28-.26-2.15-.56-2.92a5.88 5.88 0 00-1.39-2.13A5.88 5.88 0 0019.87.6c-.77-.3-1.64-.5-2.92-.56C15.66.02 15.25 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-10.85a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37s-1.04 1.02-1.04 2.48 1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.5.71.3 1.26.48 1.7.62.71.22 1.36.19 1.87.12.57-.09 1.75-.71 2-1.4.25-.69.25-1.28.17-1.4-.07-.12-.27-.2-.57-.35zM12 0C5.37 0 0 5.37 0 12c0 2.12.55 4.11 1.52 5.84L.05 23.5l5.82-1.53a11.94 11.94 0 005.13 1.2h.01c6.63 0 12-5.37 12-12S18.63 0 12 0zm0 21.87h-.01a9.85 9.85 0 01-5.02-1.37l-.36-.21-3.73.98 1-3.64-.24-.37A9.83 9.83 0 012.13 12c0-5.45 4.43-9.87 9.88-9.87 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 012.89 6.98c0 5.45-4.43 9.86-9.89 9.86z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z" />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
};

const getSocialIcon = (platform) => {
  const key = String(platform || '').toLowerCase();
  if (key.includes('github')) return SOCIAL_ICONS.github;
  if (key.includes('linkedin')) return SOCIAL_ICONS.linkedin;
  if (key.includes('instagram')) return SOCIAL_ICONS.instagram;
  if (key.includes('whatsapp')) return SOCIAL_ICONS.whatsapp;
  if (key.includes('twitter') || key.includes('x.com')) return SOCIAL_ICONS.twitter;
  if (key.includes('mail')) return SOCIAL_ICONS.email;
  return SOCIAL_ICONS.email;
};

const PROJECT_ACCENTS = [
  { pc: 'rgba(124,106,255,.25)', solid: '#7C6AFF' },
  { pc: 'rgba(79,209,197,.25)',  solid: '#4FD1C5' },
  { pc: 'rgba(255,176,102,.22)', solid: '#FFB066' },
  { pc: 'rgba(255,110,140,.20)', solid: '#FF6E8C' },
];

const ClientHome = () => {
  const [projects, setProjects] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [skills, setSkills] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [experience, setExperience] = useState([]);
  const [contactInfo, setContactInfo] = useState({});
  const [resume, setResume] = useState(null);
  const [dataReady, setDataReady] = useState(false);

  const [loaderProgress, setLoaderProgress] = useState(0);
  const [loaderHidden, setLoaderHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const rootRef = useRef(null);
  const navRef = useRef(null);
  const loaderRef = useRef(null);
  const loaderFillRef = useRef(null);
  const loaderPctRef = useRef(null);
  const marqueeTrackRef = useRef(null);

  /* ---------- DATA FETCH ---------- */
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
        projectsRes, certificatesRes, socialRes, resumeRes,
        contactRes, experienceRes, skillsRes,
      ] = results;

      if (projectsRes.status === 'fulfilled') setProjects(Array.isArray(projectsRes.value.data) ? projectsRes.value.data : []);
      if (certificatesRes.status === 'fulfilled') setCertificates(Array.isArray(certificatesRes.value.data) ? certificatesRes.value.data : []);
      if (socialRes.status === 'fulfilled') setSocialLinks(Array.isArray(socialRes.value.data) ? socialRes.value.data : []);
      if (resumeRes.status === 'fulfilled') setResume(resumeRes.value.data || null);
      if (contactRes.status === 'fulfilled') setContactInfo(contactRes.value.data || {});
      if (experienceRes.status === 'fulfilled') setExperience(Array.isArray(experienceRes.value.data) ? experienceRes.value.data : []);
      if (skillsRes.status === 'fulfilled') setSkills(Array.isArray(skillsRes.value.data) ? skillsRes.value.data : []);

      setDataReady(true);
    };

    fetchData();
    return () => { active = false; };
  }, []);

  /* ---------- LOADER ---------- */
  useLayoutEffect(() => {
    if (!dataReady) return;
    const counter = { v: 0 };

    const tl = gsap.timeline({
      onComplete: () => setLoaderHidden(true),
    });

    tl.to(counter, {
      v: 100,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        const val = Math.round(counter.v);
        setLoaderProgress(val);
        if (loaderPctRef.current) loaderPctRef.current.textContent = val + '%';
        if (loaderFillRef.current) loaderFillRef.current.style.width = val + '%';
      },
    })
      .to(loaderRef.current, {
        yPercent: -100,
        duration: 0.9,
        ease: 'power4.inOut',
        delay: 0.15,
      })
      .set(loaderRef.current, { display: 'none' });

    return () => { tl.kill(); };
  }, [dataReady]);

  /* =========================================================
     CUSTOM CURSOR  — FIXED
     Only runs AFTER the loader is hidden. Preserves -50%/-50%
     centering via GSAP xPercent/yPercent so quickTo's x/y works.
     ========================================================= */
  useLayoutEffect(() => {
    if (!loaderHidden) return;   // ← was `if (loaderHidden) return;`  — this was the bug

    const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    if (!fine) return;

    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (!dot || !ring) return;

    // Preserve the -50%/-50% centering (CSS transform gets replaced by GSAP)
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });

    const onMove = (e) => {
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    };
    window.addEventListener('mousemove', onMove);

    const growTargets = document.querySelectorAll(
      'a, button, .skill-item, .project-visual, .skill-cat, .cert-card',
    );
    const onEnter = () => ring.classList.add('grow');
    const onLeave = () => ring.classList.remove('grow');
    growTargets.forEach((el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    return () => {
      window.removeEventListener('mousemove', onMove);
      growTargets.forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
  }, [loaderHidden]);

  /* ---------- SCROLL STATE ---------- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ---------- MAIN GSAP ---------- */
  useLayoutEffect(() => {
    if (!loaderHidden) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

    const ctx = gsap.context(() => {
      /* Hero intro */
      const heroTl = gsap.timeline();

      heroTl
        .from('.nav', { y: -70, opacity: 0, duration: 0.8, ease: 'power3.out' })
        .from('.hero-title .line > span', {
          yPercent: 115, duration: 1.1, stagger: 0.09, ease: 'power4.out',
        }, '-=0.6')
        .from('.hero-desc', { y: 24, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.7')
        .from('.hero-actions .btn', { y: 20, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' }, '-=0.6')
        .from('.code-window', { y: 40, opacity: 0, scale: 0.96, duration: 1, ease: 'power3.out' }, '-=0.9')
        .from('.float-badge', { scale: 0.6, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'back.out(1.6)' }, '-=0.5')
        .from('.hero-scroll', { opacity: 0, y: 12, duration: 0.6 }, '-=0.4')
        .from('.hero-grid-bg', { opacity: 0, duration: 1.4, ease: 'power2.out' }, '-=1.2');

      /* Magnetic buttons */
      if (fine) {
        document.querySelectorAll('.magnetic').forEach((btn) => {
          const onMove = (e) => {
            const r = btn.getBoundingClientRect();
            const x = e.clientX - r.left - r.width / 2;
            const y = e.clientY - r.top - r.height / 2;
            gsap.to(btn, { x: x * 0.28, y: y * 0.4, duration: 0.5, ease: 'power3.out' });
          };
          const onLeave = () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' });
          };
          btn.addEventListener('mousemove', onMove);
          btn.addEventListener('mouseleave', onLeave);
        });
      }

      /* Marquee */
      if (marqueeTrackRef.current) {
        gsap.to(marqueeTrackRef.current, {
          xPercent: -50, duration: 30, ease: 'none', repeat: -1,
        });
      }

      /* Reveals */
      document.querySelectorAll('.reveal').forEach((el, i) => {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 0.95, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
          delay: (i % 4) * 0.07,
        });
      });
      document.querySelectorAll('.sec-title').forEach((title) => {
        gsap.from(title, {
          y: 44, opacity: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: title, start: 'top 85%' },
        });
      });

      /* Stats */
      document.querySelectorAll('.stat-num').forEach((el) => {
        const target = parseFloat(el.dataset.count || '0');
        const suffix = el.dataset.suffix || '';
        const obj = { v: 0 };
        ScrollTrigger.create({
          trigger: el, start: 'top 90%', once: true,
          onEnter: () => {
            gsap.to(obj, {
              v: target, duration: 1.8, ease: 'power2.out',
              onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; },
            });
          },
        });
      });

      /* Skills */
      if (document.querySelector('.skills-grid')) {
        gsap.from('.skill-cat', {
          y: 40, opacity: 0, duration: 0.75,
          stagger: { each: 0.1, from: 'start' }, ease: 'power3.out',
          scrollTrigger: { trigger: '.skills-grid', start: 'top 82%' },
        });
        gsap.from('.skill-item', {
          x: -14, opacity: 0, duration: 0.5,
          stagger: { each: 0.035 }, ease: 'power2.out',
          scrollTrigger: { trigger: '.skills-grid', start: 'top 78%' },
        });
      }

      /* Projects */
      document.querySelectorAll('.project').forEach((project, i) => {
        const visual = project.querySelector('.project-visual');
        const info = project.querySelector('.project-info');
        if (!visual || !info) return;
        gsap.from(visual, {
          y: 60, opacity: 0, scale: 0.96, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: project, start: 'top 80%' },
        });
        gsap.from(info.children, {
          y: 34, opacity: 0, duration: 0.85, stagger: 0.08, ease: 'power3.out',
          scrollTrigger: { trigger: project, start: 'top 80%' },
        });
        if (fine && window.innerWidth > 1024) {
          gsap.to(visual, {
            y: i % 2 === 0 ? -28 : 28, ease: 'none',
            scrollTrigger: { trigger: project, start: 'top bottom', end: 'bottom top', scrub: 1 },
          });
        }
      });

      /* Certificates */
      if (document.querySelector('.certs-grid')) {
        gsap.from('.cert-card', {
          y: 40, opacity: 0, duration: 0.75,
          stagger: 0.09, ease: 'power3.out',
          scrollTrigger: { trigger: '.certs-grid', start: 'top 82%' },
        });
      }

      /* Experience */
      if (document.querySelector('.timeline-list')) {
        gsap.from('.tl-item', {
          y: 30, opacity: 0, duration: 0.7,
          stagger: 0.08, ease: 'power3.out',
          scrollTrigger: { trigger: '.timeline-list', start: 'top 82%' },
        });
      }

      /* Resume */
      if (document.querySelector('.resume-card')) {
        gsap.from('.resume-card', {
          y: 40, opacity: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: '.resume-card', start: 'top 85%' },
        });
      }

      /* Contact */
      gsap.from('.contact h2', {
        y: 50, opacity: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: '.contact', start: 'top 78%' },
      });

      /* Hero parallax */
      gsap.to('.hero-content', {
        y: 80, opacity: 0.4, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
      if (fine) {
        document.querySelectorAll('.float-badge').forEach((b, i) => {
          gsap.to(b, {
            y: i % 2 === 0 ? -20 : 20, ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 },
          });
        });
      }
    }, rootRef);

    const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      window.clearTimeout(refreshId);
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [loaderHidden]);

  /* ---------- Mobile menu body lock ---------- */
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  /* ---------- Derived data ---------- */
  const categorizedSkills = useMemo(() => categorizeSkills(skills), [skills]);

  const marqueeItems = useMemo(() => {
    if (skills.length) return skills.map((s) => s.name);
    return ['HTML5','CSS3','JavaScript','React.js','Node.js','Express.js','MySQL','Git & GitHub','Vercel'];
  }, [skills]);

  const topSkills = useMemo(() => {
    return [...skills]
      .sort((a, b) => (b.level || 0) - (a.level || 0))
      .slice(0, 4);
  }, [skills]);

  const hasContact = Boolean(
    contactInfo?.email || contactInfo?.phone || contactInfo?.address || socialLinks.length,
  );

  const emailToDisplay = contactInfo?.email || 'hello@abdulrahman.dev';

  const scrollToTop = (e) => {
    e?.preventDefault?.();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (e, id) => {
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    setMobileMenuOpen(false);
    const navH = navRef.current?.offsetHeight || 70;
    window.scrollTo({ top: target.offsetTop - navH, behavior: 'smooth' });
  };

  /* =========================================================
     JSX
     ========================================================= */
  return (
    <>
      <div className="cursor-dot" />
      <div className="cursor-ring" />
      <div className="noise" />

      {/* LOADER */}
      {!loaderHidden && (
        <div className="loader" ref={loaderRef}>
          <div className="loader-name">
            Abdul<span>rahman</span>
          </div>
          <div className="loader-track">
            <span className="loader-fill" ref={loaderFillRef} />
          </div>
          <div className="loader-pct" ref={loaderPctRef}>
            {loaderProgress}%
          </div>
        </div>
      )}

      {/* NAV */}
      <header className={`nav ${scrolled ? 'scrolled' : ''}`} ref={navRef}>
        <div className="container nav-inner">
          <a href="#" className="logo" onClick={(e) => scrollToTop(e)}>
            <span className="logo-mark" />
            Abdulrahman
          </a>

          <nav>
            <ul className="nav-links">
              <li><a href="#about" onClick={(e) => handleNavClick(e, '#about')}>About</a></li>
              <li><a href="#skills" onClick={(e) => handleNavClick(e, '#skills')}>Skills</a></li>
              {experience.length > 0 && (
                <li><a href="#experience" onClick={(e) => handleNavClick(e, '#experience')}>Experience</a></li>
              )}
              <li><a href="#work" onClick={(e) => handleNavClick(e, '#work')}>Work</a></li>
              {certificates.length > 0 && (
                <li><a href="#certificates" onClick={(e) => handleNavClick(e, '#certificates')}>Certs</a></li>
              )}
              <li><a href="#contact" onClick={(e) => handleNavClick(e, '#contact')}>Contact</a></li>
            </ul>
          </nav>

          <a href="#contact" className="nav-cta" onClick={(e) => handleNavClick(e, '#contact')}>
            Let&apos;s Talk
          </a>

          <button
            className={`nav-toggle ${mobileMenuOpen ? 'active' : ''}`}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <a href="#about" onClick={(e) => handleNavClick(e, '#about')}>About</a>
        <a href="#skills" onClick={(e) => handleNavClick(e, '#skills')}>Skills</a>
        {experience.length > 0 && (
          <a href="#experience" onClick={(e) => handleNavClick(e, '#experience')}>Experience</a>
        )}
        <a href="#work" onClick={(e) => handleNavClick(e, '#work')}>Work</a>
        {certificates.length > 0 && (
          <a href="#certificates" onClick={(e) => handleNavClick(e, '#certificates')}>Certificates</a>
        )}
        <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')}>Contact</a>
      </div>

      <main ref={rootRef}>

        {/* HERO */}
        <section className="hero">
          <div className="hero-glow" />
          <div className="hero-glow-2" />
          <div className="hero-grid-bg" />

          <div className="container hero-inner">
            <div className="hero-grid">
              <div className="hero-content">
                <h1 className="hero-title">
                  <span className="line"><span>Full-Stack</span></span>
                  <span className="line"><span className="outline-text">Web Developer</span></span>
                  <span className="line"><span className="grad-text">Abdulrahman.</span></span>
                </h1>

                <p className="hero-desc">
                  I design and build <strong>fast, scalable web applications</strong> —
                  from clean front-end interfaces to powerful admin panels and
                  REST APIs. Turning complex requirements into simple, working products.
                </p>

                <div className="hero-actions">
                  <a href="#work" className="btn btn-primary magnetic" onClick={(e) => handleNavClick(e, '#work')}>
                    View My Work
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17L17 7M17 7H7M17 7v10" />
                    </svg>
                  </a>
                  <a href="#contact" className="btn btn-ghost magnetic" onClick={(e) => handleNavClick(e, '#contact')}>
                    Hire Me
                  </a>
                </div>
              </div>

              <div className="hero-visual">
                {topSkills[0] && <span className="float-badge fb-1"><span className="fb-dot" />{topSkills[0].name}</span>}
                {topSkills[1] && <span className="float-badge fb-2"><span className="fb-dot" />{topSkills[1].name}</span>}
                {topSkills[2] && <span className="float-badge fb-3"><span className="fb-dot" />{topSkills[2].name}</span>}
                {topSkills[3] && <span className="float-badge fb-4"><span className="fb-dot" />{topSkills[3].name}</span>}
                {topSkills.length === 0 && (
                  <>
                    <span className="float-badge fb-1"><span className="fb-dot" />React.js</span>
                    <span className="float-badge fb-2"><span className="fb-dot" />Node.js</span>
                    <span className="float-badge fb-3"><span className="fb-dot" />MySQL</span>
                    <span className="float-badge fb-4"><span className="fb-dot" />Express</span>
                  </>
                )}

                <div className="code-window">
                  <div className="code-bar">
                    <span className="code-dot r" />
                    <span className="code-dot y" />
                    <span className="code-dot g" />
                    <span className="code-file">developer.js</span>
                  </div>
                  <div className="code-body">
<pre><code>
<span className="code-line"><span className="c-line-num">1</span><span className="c-com">{'// building things that work'}</span></span>
<span className="code-line"><span className="c-line-num">2</span><span className="c-key">const</span> <span className="c-var">developer</span> <span className="c-punc">=</span> <span className="c-punc">{'{'}</span></span>
<span className="code-line"><span className="c-line-num">3</span>  <span className="c-prop">name</span><span className="c-punc">:</span> <span className="c-str">'Abdulrahman'</span><span className="c-punc">,</span></span>
<span className="code-line"><span className="c-line-num">4</span>  <span className="c-prop">role</span><span className="c-punc">:</span> <span className="c-str">'Full-Stack Developer'</span><span className="c-punc">,</span></span>
<span className="code-line"><span className="c-line-num">5</span>  <span className="c-prop">stack</span><span className="c-punc">:</span> <span className="c-punc">[</span><span className="c-str">'React'</span><span className="c-punc">,</span> <span className="c-str">'Node'</span><span className="c-punc">,</span> <span className="c-str">'MySQL'</span><span className="c-punc">],</span></span>
<span className="code-line"><span className="c-line-num">6</span>  <span className="c-prop">builds</span><span className="c-punc">:</span> <span className="c-str">'scalable products'</span><span className="c-punc">,</span></span>
<span className="code-line"><span className="c-line-num">7</span>  <span className="c-fn">ship</span><span className="c-punc">()</span> <span className="c-punc">{'{'}</span></span>
<span className="code-line"><span className="c-line-num">8</span>    <span className="c-key">return</span> <span className="c-str">'clean code, real results'</span><span className="c-punc">;</span></span>
<span className="code-line"><span className="c-line-num">9</span>  <span className="c-punc">{'}'}</span></span>
<span className="code-line"><span className="c-line-num">10</span><span className="c-punc">{'};'}</span><span className="cursor-blink" /></span>
</code></pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-scroll">
            <span>Scroll</span>
            <span className="scroll-line" />
          </div>
        </section>

        {/* MARQUEE */}
        <div className="marquee">
          <div className="marquee-track" ref={marqueeTrackRef}>
            {[0, 1].map((group) => (
              <div className="marquee-group" key={group} aria-hidden={group === 1 ? 'true' : undefined}>
                {marqueeItems.map((item, i) => (
                  <span className="marquee-item" key={`${group}-${i}`}>{item}</span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ABOUT */}
        <section className="sec" id="about">
          <div className="container">
            <div className="about-grid">
              <div>
                <div className="sec-head reveal">
                  <div className="sec-label">About Me</div>
                  <h2 className="sec-title">
                    Code that&apos;s clean.<br />
                    <em>Products that ship.</em>
                  </h2>
                </div>
                <div className="about-text">
                  <p className="reveal">
                    I&apos;m <strong>Abdulrahman</strong>, a web developer focused on building
                    complete, production-ready systems. My work spans both sides of the
                    stack — pixel-accurate front-ends and solid, well-structured back-ends.
                  </p>
                  <p className="reveal">
                    I&apos;ve built <strong>car rental platforms</strong>, <strong>hotel booking
                    systems</strong>, <strong>school management software</strong> and
                    <strong> POS systems</strong> — each with full admin dashboards for real
                    business operations. I care about clean architecture, smooth UX and
                    code that the next developer can actually read.
                  </p>
                  <p className="reveal">
                    Currently working with <strong>React.js, Node.js, Express and MySQL</strong> —
                    and deploying on Vercel with Git-based workflows.
                  </p>
                </div>
              </div>

              <div className="stats reveal">
                <div className="stat">
                  <div className="stat-num" data-count={Math.max(projects.length, 1)}>0</div>
                  <div className="stat-lbl">Major Projects</div>
                </div>
                <div className="stat">
                  <div className="stat-num" data-count={Math.max(skills.length, 1)}>0</div>
                  <div className="stat-lbl">Technologies</div>
                </div>
                <div className="stat">
                  <div className="stat-num" data-count={Math.max(certificates.length, 1)}>0</div>
                  <div className="stat-lbl">Certificates</div>
                </div>
                <div className="stat">
                  <div className="stat-num" data-count="100" data-suffix="%">0</div>
                  <div className="stat-lbl">Commitment</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SKILLS */}
        {categorizedSkills.length > 0 && (
          <section className="sec" id="skills" style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="sec-head reveal">
                <div className="sec-label">Tech Stack</div>
                <h2 className="sec-title">
                  Tools I build with <em>every day.</em>
                </h2>
                <p className="sec-sub">
                  A complete stack for building, styling, connecting and shipping modern web products.
                </p>
              </div>

              <div className="skills-grid">
                {categorizedSkills.map((cat) => (
                  <div
                    className="skill-cat"
                    key={cat.title}
                    style={{ '--cat-color': cat.color, '--cat-glow': cat.glow }}
                  >
                    <div className="skill-cat-head">
                      <span className="skill-cat-num">{cat.num}</span>
                      <h3>{cat.title}</h3>
                      <span className="skill-cat-count">
                        {String(cat.items.length).padStart(2, '0')}
                      </span>
                    </div>
                    <ul className="skill-list">
                      {cat.items.map((item) => (
                        <li className="skill-item" key={item.id}>{item.name}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* EXPERIENCE */}
        {experience.length > 0 && (
          <section className="sec" id="experience" style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="sec-head reveal">
                <div className="sec-label">Experience</div>
                <h2 className="sec-title">
                  Where I&apos;ve worked.<br />
                  <em>Roles &amp; teams.</em>
                </h2>
              </div>

              <div className="timeline-list">
                {experience.map((exp) => (
                  <article className="tl-item" key={exp.id}>
                    <div className="tl-date">
                      {exp.start_date || '—'}
                      <br />
                      {exp.end_date || 'Present'}
                    </div>
                    <div className="tl-content">
                      <h3>{exp.role_title}</h3>
                      {exp.company && <div className="tl-company">{exp.company}</div>}
                      {exp.description && <p>{exp.description}</p>}
                    </div>
                    {exp.type && <div className="tl-type">{exp.type}</div>}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* PROJECTS */}
        {projects.length > 0 && (
          <section className="sec" id="work" style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="sec-head reveal">
                <div className="sec-label">Selected Work</div>
                <h2 className="sec-title">
                  Projects built end-to-end,<br />
                  <em>with real admin control.</em>
                </h2>
              </div>

              <div className="projects">
                {projects.map((project, i) => {
                  const accent = PROJECT_ACCENTS[i % PROJECT_ACCENTS.length];
                  const tags = String(project.tech_stack || '')
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean);
                  const link = project.live_url || project.github_url || '#';
                  return (
                    <article className="project" key={project.id}>
                      <div
                        className="project-visual"
                        style={{ '--pc': accent.pc, '--pc-solid': accent.solid }}
                      >
                        <div className="browser">
                          <div className="browser-bar">
                            <i /><i /><i />
                            <span className="url" />
                          </div>
                          <div className="browser-body">
                            <div className="b-top">
                              <span className="b-title" />
                              <span className="b-pill" />
                            </div>
                            <div className="b-cards">
                              <div className="b-card" />
                              <div className="b-card" />
                              <div className="b-card" />
                            </div>
                            <div className="b-rows">
                              <div className="b-row"><span /><span /><span /></div>
                              <div className="b-row"><span /><span /><span /></div>
                              <div className="b-row"><span /><span /><span /></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="project-info">
                        <span className="p-num">
                          {String(i + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
                        </span>
                        <h3>{project.title}</h3>
                        {project.description && <p>{project.description}</p>}
                        {tags.length > 0 && (
                          <div className="tags">
                            {tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
                          </div>
                        )}
                        <a
                          href={link}
                          className="p-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Project
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 17L17 7M17 7H7M17 7v10" />
                          </svg>
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* CERTIFICATES */}
        {certificates.length > 0 && (
          <section className="sec" id="certificates" style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="sec-head reveal">
                <div className="sec-label">Certifications</div>
                <h2 className="sec-title">
                  Proof of learning.<br />
                  <em>Always growing.</em>
                </h2>
              </div>

              <div className="certs-grid">
                {certificates.map((cert, i) => (
                  <article className="cert-card" key={cert.id}>
                    <div className="cert-top">
                      <span className="cert-badge">CERT {String(i + 1).padStart(2, '0')}</span>
                      <span className="cert-year">
                        {cert.issue_date ? new Date(cert.issue_date).getFullYear() : '—'}
                      </span>
                    </div>

                    {cert.image_url && (
                      <div className="cert-img-wrap">
                        <img
                          src={cert.image_url}
                          alt={`${cert.title} certificate`}
                          loading="lazy"
                        />
                      </div>
                    )}

                    <h3>{cert.title}</h3>
                    {cert.issuer && <p className="cert-issuer">{cert.issuer}</p>}

                    {cert.certificate_url && (
                      <a
                        href={cert.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cert-link"
                      >
                        Verify certificate
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 17L17 7M17 7H7M17 7v10" />
                        </svg>
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* RESUME */}
        {resume?.file_url && (
          <section className="sec resume-sec" id="resume">
            <div className="container">
              <div className="resume-card reveal">
                <div className="resume-icon">PDF</div>
                <div className="resume-body">
                  <h3>Want the full picture?</h3>
                  <p>
                    Download my resume for a complete snapshot of my experience,
                    skills, projects and learning journey — all in one document.
                  </p>
                </div>
                <a
                  href={resume.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary magnetic"
                >
                  Download Resume
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </a>
              </div>
            </div>
          </section>
        )}

        {/* CONTACT */}
        <section className="contact" id="contact">
          <div className="contact-glow" />
          <div className="container contact-inner">
            <div className="sec-label reveal">Get In Touch</div>
            <h2 className="reveal">
              Let&apos;s build something<br />
              worth shipping.
            </h2>
            <p className="reveal">
              Have a project, an idea, or a role in mind? Send a message and let&apos;s talk about how I can help.
            </p>
            <a href={`mailto:${emailToDisplay}`} className="email-link reveal">
              {emailToDisplay}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </a>

            <div className="socials reveal">
              {socialLinks.length > 0 ? (
                socialLinks.map((link) => (
                  <a
                    href={link.url}
                    key={link.id}
                    className="social"
                    aria-label={link.platform}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {getSocialIcon(link.platform)}
                  </a>
                ))
              ) : (
                <>
                  <a href="#" className="social" aria-label="GitHub">{SOCIAL_ICONS.github}</a>
                  <a href="#" className="social" aria-label="LinkedIn">{SOCIAL_ICONS.linkedin}</a>
                  <a href="#" className="social" aria-label="Email">{SOCIAL_ICONS.email}</a>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-watermark" aria-hidden="true">ABDULRAHMAN</div>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3><span className="logo-mark" />Abdulrahman</h3>
              <p>
                Full-stack web developer building fast, scalable and production-ready
                applications — from clean interfaces to powerful admin systems.
              </p>
            </div>

            <div className="footer-col">
              <h4>Navigate</h4>
              <ul>
                <li><a href="#about" onClick={(e) => handleNavClick(e, '#about')}>About</a></li>
                <li><a href="#skills" onClick={(e) => handleNavClick(e, '#skills')}>Skills</a></li>
                <li><a href="#work" onClick={(e) => handleNavClick(e, '#work')}>Work</a></li>
                <li><a href="#contact" onClick={(e) => handleNavClick(e, '#contact')}>Contact</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Projects</h4>
              <ul>
                {projects.slice(0, 4).map((p) => (
                  <li key={p.id}>
                    <a href="#work" onClick={(e) => handleNavClick(e, '#work')}>
                      {p.title}
                    </a>
                  </li>
                ))}
                {projects.length === 0 && (
                  <>
                    <li><a href="#work">Car Rental System</a></li>
                    <li><a href="#work">Hotel Booking</a></li>
                    <li><a href="#work">School Management</a></li>
                    <li><a href="#work">POS Software</a></li>
                  </>
                )}
              </ul>
            </div>

            <div className="footer-col">
              <h4>Connect</h4>
              <ul>
                {socialLinks.slice(0, 3).map((link) => (
                  <li key={link.id}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      {link.platform}
                    </a>
                  </li>
                ))}
                <li>
                  <a href={`mailto:${emailToDisplay}`}>Email Me</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Abdulrahman. All rights reserved.</p>
            <a href="#" className="back-top" onClick={scrollToTop}>
              Back to top
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </a>
            <p>
              Developed by <a
                href="https://www.linkedin.com/in/abdulrahman-awan-5184aa373/"
                target="_blank"
                rel="noopener noreferrer"
              >Abdulrahman</a> <span className="footer-heart">♥</span>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default ClientHome;