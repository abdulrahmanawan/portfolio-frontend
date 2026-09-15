import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import gsap from 'gsap';
import API from '../services/api';
import { auth } from '../config/firebase';

const TABS = [
  { value: 'projects',     label: 'Projects',     short: 'Projects', icon: 'projects'     },
  { value: 'certificates', label: 'Certificates', short: 'Certs',    icon: 'certificates' },
  { value: 'skills',       label: 'Skills',       short: 'Skills',   icon: 'skills'       },
  { value: 'social',       label: 'Social links', short: 'Social',   icon: 'social'       },
  { value: 'resume',       label: 'Resume',       short: 'Resume',   icon: 'resume'       },
  { value: 'experience',   label: 'Experience',   short: 'Work',     icon: 'experience'   },
  { value: 'contact',      label: 'Contact',      short: 'Contact',  icon: 'contact'      },
];

const Icon = ({ name }) => {
  const common = {
    width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  switch (name) {
    case 'projects':
      return (<svg {...common}><rect x="3" y="3" width="7.5" height="7.5" rx="1.6" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" /></svg>);
    case 'certificates':
      return (<svg {...common}><circle cx="12" cy="9" r="5" /><path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5" /></svg>);
    case 'skills':
      return (<svg {...common}><path d="M3 20h18" /><rect x="4" y="12" width="3" height="8" rx="1" /><rect x="10.5" y="7" width="3" height="13" rx="1" /><rect x="17" y="3" width="3" height="17" rx="1" /></svg>);
    case 'social':
      return (<svg {...common}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="10.5" x2="15.4" y2="6.5" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /></svg>);
    case 'resume':
      return (<svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>);
    case 'experience':
      return (<svg {...common}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="2" y1="13" x2="22" y2="13" /></svg>);
    case 'contact':
      return (<svg {...common}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
    case 'external':
      return (<svg {...common}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>);
    default:
      return null;
  }
};

const emptyForms = {
  projects: { title: '', description: '', tech_stack: '', live_url: '', github_url: '', image_url: '' },
  certificates: { title: '', issuer: '', issue_date: '', certificate_url: '', image_url: '' },
  skills: { name: '', level: 60, sort_order: 0 },
  social: { platform: '', url: '' },
  resume: { file_url: '' },
  experience: { role_title: '', company: '', start_date: '', end_date: '', description: '', type: '' },
  contact: { email: '', phone: '', address: '', profile_image_url: '' },
};

const iconForPlatform = (platform = '') => {
  const value = platform.toLowerCase();
  if (value.includes('github')) return 'GH';
  if (value.includes('linkedin')) return 'in';
  if (value.includes('instagram')) return 'IG';
  if (value.includes('whatsapp')) return 'WA';
  return '↗';
};

const formatDate = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const isAuthorizedError = (error) => [401, 403].includes(error?.response?.status);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [skills, setSkills] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [resume, setResume] = useState(null);
  const [contact, setContact] = useState(null);
  const [experience, setExperience] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const rootRef = useRef(null);
  const bodyRef = useRef(null);
  const navbarRef = useRef(null);
  const bottomNavRef = useRef(null);

  // ---------------- Auth ----------------
  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!mounted) return;
      setUser(currentUser);
      if (!currentUser) {
        navigate('/admin/login', { replace: true });
        return;
      }
      try {
        await API.get('/admin/me');
        if (mounted) await fetchAllData();
      } catch (error) {
        if (isAuthorizedError(error)) {
          await signOut(auth).catch(() => {});
          navigate('/admin/login', { replace: true });
          return;
        }
        if (mounted) {
          setLoading(false);
          setMessage({ type: 'danger', text: error.response?.data?.msg || 'Could not verify admin access.' });
        }
      }
    });
    return () => { mounted = false; unsubscribe(); };
  }, [navigate]);

  // ---------------- Data ----------------
  const fetchAllData = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    const results = await Promise.allSettled([
      API.get('/projects'),
      API.get('/certificates'),
      API.get('/skills'),
      API.get('/social'),
      API.get('/resume'),
      API.get('/contact'),
      API.get('/experience'),
    ]);

    const [
      projectsRes, certificatesRes, skillsRes, socialRes, resumeRes, contactRes, experienceRes,
    ] = results;

    if (projectsRes.status === 'fulfilled') setProjects(Array.isArray(projectsRes.value.data) ? projectsRes.value.data : []);
    if (certificatesRes.status === 'fulfilled') setCertificates(Array.isArray(certificatesRes.value.data) ? certificatesRes.value.data : []);
    if (skillsRes.status === 'fulfilled') setSkills(Array.isArray(skillsRes.value.data) ? skillsRes.value.data : []);
    if (socialRes.status === 'fulfilled') setSocialLinks(Array.isArray(socialRes.value.data) ? socialRes.value.data : []);
    if (resumeRes.status === 'fulfilled') setResume(resumeRes.value.data || null);
    if (contactRes.status === 'fulfilled') setContact(contactRes.value.data || null);
    if (experienceRes.status === 'fulfilled') setExperience(Array.isArray(experienceRes.value.data) ? experienceRes.value.data : []);

    const unauthorized = results.some((r) => r.status === 'rejected' && isAuthorizedError(r.reason));
    if (unauthorized) {
      await signOut(auth).catch(() => {});
      navigate('/admin/login', { replace: true });
      return;
    }
    if (results.some((r) => r.status === 'rejected')) {
      setMessage({ type: 'warning', text: 'Some data could not be loaded.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'resume') {
      setFormData({ file_url: resume?.file_url || '' });
    } else if (activeTab === 'contact') {
      setFormData({
        email: contact?.email || '',
        phone: contact?.phone || '',
        address: contact?.address || '',
        profile_image_url: contact?.profile_image_url || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, resume, contact]);

  // ---------------- GSAP ----------------
  useLayoutEffect(() => {
    if (loading) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      if (navbarRef.current) gsap.from(navbarRef.current, { y: -22, opacity: 0, duration: 0.6, ease: 'expo.out' });
      gsap.from('.cms-navbar-tab', { y: -10, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'expo.out', delay: 0.15 });
      gsap.from('.cms-navbar-right > *', { y: -10, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'expo.out', delay: 0.2 });
      if (bottomNavRef.current) gsap.from(bottomNavRef.current, { y: 40, opacity: 0, duration: 0.6, ease: 'expo.out', delay: 0.1 });
      if (bodyRef.current) {
        gsap.from(bodyRef.current.querySelectorAll('.cms-file-head > *'), { y: 22, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'expo.out', delay: 0.25 });
        gsap.from(bodyRef.current.querySelectorAll('.cms-panel'), { y: 26, opacity: 0, duration: 0.7, stagger: 0.09, ease: 'expo.out', delay: 0.35 });
      }
    }, rootRef);
    return () => ctx.revert();
  }, [loading]);

  useLayoutEffect(() => {
    if (loading) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo('.cms-file-head > *', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'expo.out' });
      gsap.fromTo('.cms-panel, .cms-single-row, .cms-social-row', { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.06, ease: 'expo.out', delay: 0.05 });
      gsap.fromTo('.cms-table tbody tr', { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.03, ease: 'power2.out', delay: 0.1 });
      const formPanel = bodyRef.current?.querySelector('form.cms-panel');
      if (formPanel) gsap.fromTo(formPanel, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
    }, bodyRef);
    return () => ctx.revert();
  }, [activeTab, loading]);

  useLayoutEffect(() => {
    if (!message.text) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const el = bodyRef.current?.querySelector('.cms-alert');
    if (!el) return;
    gsap.fromTo(el, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'expo.out' });
  }, [message]);

  // ---------------- CRUD ----------------
  const openForm = (type, initialData = {}) => {
    setMessage({ type: '', text: '' });
    setFormData({ ...emptyForms[type], ...initialData });
  };
  const closeForm = () => setFormData({});
  const updateField = (field, value) => setFormData((current) => ({ ...current, [field]: value }));

  const handleDelete = async (type, id = null) => {
    const label = type === 'resume' ? 'resume' : type;
    if (!window.confirm(`Delete this ${label}? This action cannot be undone.`)) return;
    try {
      setMessage({ type: '', text: '' });
      if (type === 'resume') await API.delete('/resume');
      else await API.delete(`/${type}/${id}`);
      setFormData({});
      setMessage({ type: 'success', text: `${label} deleted successfully.` });
      await fetchAllData();
    } catch (error) {
      if (isAuthorizedError(error)) {
        await signOut(auth).catch(() => {});
        navigate('/admin/login', { replace: true });
        return;
      }
      setMessage({ type: 'danger', text: error.response?.data?.msg || 'Delete failed.' });
    }
  };

  const handleSubmit = async (type, data, id = null) => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      if (type === 'contact') await API.put('/contact', data);
      else if (type === 'resume') await API.put('/resume', data);
      else if (id) await API.put(`/${type}/${id}`, data);
      else await API.post(`/${type}`, data);

      if (type !== 'resume' && type !== 'contact') setFormData({});
      setMessage({ type: 'success', text: 'Saved successfully.' });
      await fetchAllData();
    } catch (error) {
      if (isAuthorizedError(error)) {
        await signOut(auth).catch(() => {});
        navigate('/admin/login', { replace: true });
        return;
      }
      setMessage({ type: 'danger', text: error.response?.data?.msg || error.message || 'Operation failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await signOut(auth); }
    finally { navigate('/admin/login', { replace: true }); }
  };

  const selectTab = (value) => {
    setActiveTab(value);
    if (value !== 'resume' && value !== 'contact') setFormData({});
    setMessage({ type: '', text: '' });
  };

  const counts = useMemo(
    () => ({
      projects: projects.length,
      certificates: certificates.length,
      skills: skills.length,
      social: socialLinks.length,
      resume: resume?.file_url ? 1 : 0,
      experience: experience.length,
      contact: contact ? 1 : 0,
    }),
    [projects.length, certificates.length, skills.length, socialLinks.length, resume, experience.length, contact],
  );

  const commonFormActions = (id = null, onCancel = null) => (
    <div className="cms-form-actions">
      <button type="submit" className="cms-btn cms-btn-primary" disabled={saving}>
        {saving ? <><span className="cms-spinner dark" /> Saving…</> : id ? 'Update' : 'Save'}
      </button>
      {onCancel && (
        <button type="button" className="cms-btn" onClick={onCancel} disabled={saving}>Cancel</button>
      )}
    </div>
  );

  const renderEmptyRow = (columns, text) => (
    <tr><td colSpan={columns} className="cms-empty">{text}</td></tr>
  );

  // ---------------- TABS ----------------
  const renderProjects = () => (
    <div>
      <div className="cms-file-head">
        <div><h1>Projects</h1><p>Shown on the public site under “Things I&apos;ve built.”</p></div>
        <button className="cms-btn cms-btn-primary" onClick={() => openForm('projects')}>+ Add project</button>
      </div>
      {Object.keys(formData).length > 0 && (
        <form className="cms-panel" onSubmit={(e) => { e.preventDefault(); handleSubmit('projects', formData, formData.id); }}>
          <div className="cms-panel-head"><span>{formData.id ? 'Edit project' : 'New project'}</span></div>
          <div className="cms-panel-body">
            <div className="cms-field-grid">
              <label><span>Title</span><input value={formData.title || ''} onChange={(e) => updateField('title', e.target.value)} required /></label>
              <label><span>Tech stack</span><input value={formData.tech_stack || ''} onChange={(e) => updateField('tech_stack', e.target.value)} placeholder="React, Express, MySQL" /></label>
              <label><span>Live URL</span><input type="url" value={formData.live_url || ''} onChange={(e) => updateField('live_url', e.target.value)} placeholder="https://..." /></label>
              <label><span>GitHub URL</span><input type="url" value={formData.github_url || ''} onChange={(e) => updateField('github_url', e.target.value)} placeholder="https://github.com/..." /></label>
              <label className="cms-field-full"><span>Image URL</span><input type="url" value={formData.image_url || ''} onChange={(e) => updateField('image_url', e.target.value)} placeholder="https://..." /></label>
              <label className="cms-field-full"><span>Description</span><textarea rows="4" value={formData.description || ''} onChange={(e) => updateField('description', e.target.value)} /></label>
            </div>
            {formData.image_url && <div className="cms-preview"><img src={formData.image_url} alt="Project preview" /></div>}
            {commonFormActions(formData.id, closeForm)}
          </div>
        </form>
      )}
      <div className="cms-panel">
        <div className="cms-panel-head"><span>{projects.length} project{projects.length === 1 ? '' : 's'}</span></div>
        <div className="cms-table-wrap">
          <table className="cms-table">
            <thead><tr><th>Project</th><th>Stack</th><th>Live</th><th>Image</th><th></th></tr></thead>
            <tbody>
              {projects.length === 0 ? renderEmptyRow(5, 'No projects yet.') : projects.map((project) => (
                <tr key={project.id}>
                  <td><strong>{project.title}</strong><small>{project.description || 'No description'}</small></td>
                  <td>{project.tech_stack || '—'}</td>
                  <td>{project.live_url ? <a href={project.live_url} target="_blank" rel="noreferrer" className="cms-link">Open ↗</a> : '—'}</td>
                  <td>{project.image_url ? <img className="cms-thumb" src={project.image_url} alt="" /> : <span className="cms-chip">none</span>}</td>
                  <td><div className="cms-row-actions">
                    <button className="cms-icon-btn" onClick={() => openForm('projects', project)}>Edit</button>
                    <button className="cms-icon-btn danger" onClick={() => handleDelete('projects', project.id)}>Delete</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCertificates = () => (
    <div>
      <div className="cms-file-head">
        <div><h1>Certificates</h1><p>Displayed as proof of learning on the public site.</p></div>
        <button className="cms-btn cms-btn-primary" onClick={() => openForm('certificates')}>+ Add certificate</button>
      </div>
      {Object.keys(formData).length > 0 && (
        <form className="cms-panel" onSubmit={(e) => { e.preventDefault(); handleSubmit('certificates', formData, formData.id); }}>
          <div className="cms-panel-head"><span>{formData.id ? 'Edit certificate' : 'New certificate'}</span></div>
          <div className="cms-panel-body">
            <div className="cms-field-grid">
              <label><span>Title</span><input value={formData.title || ''} onChange={(e) => updateField('title', e.target.value)} required /></label>
              <label><span>Issuer</span><input value={formData.issuer || ''} onChange={(e) => updateField('issuer', e.target.value)} /></label>
              <label><span>Issue date</span><input type="date" value={String(formData.issue_date || '').slice(0, 10)} onChange={(e) => updateField('issue_date', e.target.value)} /></label>
              <label><span>Certificate URL</span><input type="url" value={formData.certificate_url || ''} onChange={(e) => updateField('certificate_url', e.target.value)} placeholder="https://..." /></label>
              <label className="cms-field-full"><span>Certificate image URL</span><input type="url" value={formData.image_url || ''} onChange={(e) => updateField('image_url', e.target.value)} placeholder="https://..." /></label>
            </div>
            {formData.image_url && <div className="cms-preview contain"><img src={formData.image_url} alt="Certificate preview" /></div>}
            {commonFormActions(formData.id, closeForm)}
          </div>
        </form>
      )}
      <div className="cms-panel">
        <div className="cms-panel-head"><span>{certificates.length} certificate{certificates.length === 1 ? '' : 's'}</span></div>
        <div className="cms-table-wrap">
          <table className="cms-table">
            <thead><tr><th>Certificate</th><th>Issuer</th><th>Date</th><th>Image</th><th></th></tr></thead>
            <tbody>
              {certificates.length === 0 ? renderEmptyRow(5, 'No certificates yet.') : certificates.map((certificate) => (
                <tr key={certificate.id}>
                  <td><strong>{certificate.title}</strong></td>
                  <td>{certificate.issuer || '—'}</td>
                  <td>{formatDate(certificate.issue_date)}</td>
                  <td>{certificate.image_url ? <img className="cms-thumb contain" src={certificate.image_url} alt={certificate.title} /> : '—'}</td>
                  <td><div className="cms-row-actions">
                    <button className="cms-icon-btn" onClick={() => openForm('certificates', certificate)}>Edit</button>
                    <button className="cms-icon-btn danger" onClick={() => handleDelete('certificates', certificate.id)}>Delete</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSkills = () => (
    <div>
      <div className="cms-file-head">
        <div><h1>Skills</h1><p>The animated bars shown under “How I work.”</p></div>
        <button className="cms-btn cms-btn-primary" onClick={() => openForm('skills')}>+ Add skill</button>
      </div>
      {Object.keys(formData).length > 0 && (
        <form className="cms-panel" onSubmit={(e) => { e.preventDefault(); handleSubmit('skills', formData, formData.id); }}>
          <div className="cms-panel-head"><span>{formData.id ? 'Edit skill' : 'New skill'}</span></div>
          <div className="cms-panel-body">
            <div className="cms-field-grid">
              <label>
                <span>Skill name</span>
                <input
                  value={formData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="React.js"
                  required
                />
              </label>
              <label>
                <span>Level (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.level ?? 60}
                  onChange={(e) => updateField('level', e.target.value)}
                  placeholder="60"
                  required
                />
              </label>
              <label>
                <span>Sort order</span>
                <input
                  type="number"
                  value={formData.sort_order ?? 0}
                  onChange={(e) => updateField('sort_order', e.target.value)}
                  placeholder="0"
                />
              </label>
            </div>
            {/* Live preview of the bar */}
            <div className="cms-preview-skill">
              <div className="skill-head">
                <span className="skill-name">{formData.name || 'Skill name'}</span>
                <span className="skill-percent">{Math.max(0, Math.min(100, Number(formData.level) || 0))}%</span>
              </div>
              <div className="skill-bar">
                <span
                  className="skill-fill"
                  style={{ width: `${Math.max(0, Math.min(100, Number(formData.level) || 0))}%` }}
                />
              </div>
            </div>
            {commonFormActions(formData.id, closeForm)}
          </div>
        </form>
      )}
      <div className="cms-panel">
        <div className="cms-panel-head"><span>{skills.length} skill{skills.length === 1 ? '' : 's'}</span></div>
        <div className="cms-table-wrap">
          <table className="cms-table">
            <thead><tr><th>Skill</th><th>Level</th><th>Order</th><th></th></tr></thead>
            <tbody>
              {skills.length === 0 ? renderEmptyRow(4, 'No skills yet.') : skills.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.level}%</td>
                  <td>{s.sort_order}</td>
                  <td><div className="cms-row-actions">
                    <button className="cms-icon-btn" onClick={() => openForm('skills', s)}>Edit</button>
                    <button className="cms-icon-btn danger" onClick={() => handleDelete('skills', s.id)}>Delete</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSocial = () => (
    <div>
      <div className="cms-file-head">
        <div><h1>Social links</h1><p>The destinations linked from your contact section.</p></div>
        <button className="cms-btn cms-btn-primary" onClick={() => openForm('social')}>+ Add link</button>
      </div>
      {Object.keys(formData).length > 0 && (
        <form className="cms-panel" onSubmit={(e) => { e.preventDefault(); handleSubmit('social', formData, formData.id); }}>
          <div className="cms-panel-head"><span>{formData.id ? 'Edit social link' : 'New social link'}</span></div>
          <div className="cms-panel-body">
            <div className="cms-field-grid">
              <label><span>Platform</span><input value={formData.platform || ''} onChange={(e) => updateField('platform', e.target.value)} placeholder="github" required /></label>
              <label><span>URL</span><input type="url" value={formData.url || ''} onChange={(e) => updateField('url', e.target.value)} placeholder="https://..." required /></label>
            </div>
            {commonFormActions(formData.id, closeForm)}
          </div>
        </form>
      )}
      <div className="cms-social-list">
        {socialLinks.length === 0
          ? <div className="cms-panel"><div className="cms-empty">No social links yet.</div></div>
          : socialLinks.map((link) => (
            <div className="cms-social-row" key={link.id}>
              <div className="cms-social-mark">{iconForPlatform(link.platform)}</div>
              <div><strong>{link.platform}</strong><span className="url">{link.url}</span></div>
              <div className="cms-row-actions">
                <button className="cms-icon-btn" onClick={() => openForm('social', link)}>Edit</button>
                <button className="cms-icon-btn danger" onClick={() => handleDelete('social', link.id)}>Delete</button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const renderResume = () => (
    <div>
      <div className="cms-file-head">
        <div><h1>Resume</h1><p>A hosted, public HTTPS link to your current resume.</p></div>
      </div>
      <div className="cms-single-row">
        <div className="cms-single-left">
          <div className="cms-file-icon">PDF</div>
          <div>
            <h3>{resume?.file_url ? 'Resume is live' : 'No resume saved yet'}</h3>
            <p>{resume?.file_url || 'Add a hosted resume URL below.'}</p>
          </div>
        </div>
        {resume?.file_url && <a className="cms-btn" href={resume.file_url} target="_blank" rel="noreferrer">Open ↗</a>}
      </div>
      <form className="cms-panel" onSubmit={(e) => { e.preventDefault(); handleSubmit('resume', { file_url: formData.file_url?.trim() }); }}>
        <div className="cms-panel-head"><span>{resume ? 'Replace resume URL' : 'Add resume URL'}</span></div>
        <div className="cms-panel-body">
          <label><span>Resume URL</span><input type="url" value={formData.file_url || ''} onChange={(e) => updateField('file_url', e.target.value)} placeholder="https://..." required /></label>
          <div className="cms-form-actions">
            <button type="submit" className="cms-btn cms-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save resume URL'}</button>
            {resume && <button type="button" className="cms-btn cms-btn-danger" onClick={() => handleDelete('resume')}>Delete resume</button>}
          </div>
        </div>
      </form>
    </div>
  );

  const renderExperience = () => (
    <div>
      <div className="cms-file-head">
        <div><h1>Experience</h1><p>The timeline shown under “Where I&apos;ve worked.”</p></div>
        <button className="cms-btn cms-btn-primary" onClick={() => openForm('experience')}>+ Add experience</button>
      </div>
      {Object.keys(formData).length > 0 && (
        <form className="cms-panel" onSubmit={(e) => { e.preventDefault(); handleSubmit('experience', formData, formData.id); }}>
          <div className="cms-panel-head"><span>{formData.id ? 'Edit experience' : 'New experience'}</span></div>
          <div className="cms-panel-body">
            <div className="cms-field-grid">
              <label><span>Role title</span><input value={formData.role_title || ''} onChange={(e) => updateField('role_title', e.target.value)} required /></label>
              <label><span>Company</span><input value={formData.company || ''} onChange={(e) => updateField('company', e.target.value)} /></label>
              <label><span>Start date</span><input value={formData.start_date || ''} onChange={(e) => updateField('start_date', e.target.value)} placeholder="2025-01" /></label>
              <label><span>End date</span><input value={formData.end_date || ''} onChange={(e) => updateField('end_date', e.target.value)} placeholder="Present" /></label>
              <label><span>Type</span><input value={formData.type || ''} onChange={(e) => updateField('type', e.target.value)} placeholder="Internship / Full-time" /></label>
              <label className="cms-field-full"><span>Description</span><textarea rows="4" value={formData.description || ''} onChange={(e) => updateField('description', e.target.value)} /></label>
            </div>
            {commonFormActions(formData.id, closeForm)}
          </div>
        </form>
      )}
      <div className="cms-panel">
        <div className="cms-panel-head"><span>{experience.length} entr{experience.length === 1 ? 'y' : 'ies'}</span></div>
        <div className="cms-table-wrap">
          <table className="cms-table">
            <thead><tr><th>Role</th><th>Company</th><th>Period</th><th>Type</th><th></th></tr></thead>
            <tbody>
              {experience.length === 0 ? renderEmptyRow(5, 'No experience entries yet.') : experience.map((entry) => (
                <tr key={entry.id}>
                  <td><strong>{entry.role_title}</strong><small>{entry.description || 'No description'}</small></td>
                  <td>{entry.company || '—'}</td>
                  <td>{entry.start_date || '—'} — {entry.end_date || 'Present'}</td>
                  <td><span className="cms-chip">{entry.type || 'General'}</span></td>
                  <td><div className="cms-row-actions">
                    <button className="cms-icon-btn" onClick={() => openForm('experience', entry)}>Edit</button>
                    <button className="cms-icon-btn danger" onClick={() => handleDelete('experience', entry.id)}>Delete</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContact = () => (
    <div>
      <div className="cms-file-head">
        <div><h1>Contact &amp; profile</h1><p>Powers the public contact section and the hero profile image.</p></div>
      </div>
      <form className="cms-panel" onSubmit={(e) => {
        e.preventDefault();
        handleSubmit('contact', {
          email: formData.email?.trim() || '',
          phone: formData.phone?.trim() || '',
          address: formData.address?.trim() || '',
          profile_image_url: formData.profile_image_url?.trim() || '',
        });
      }}>
        <div className="cms-panel-head"><span>Contact details</span></div>
        <div className="cms-panel-body">
          <div className="cms-field-grid">
            <label><span>Email</span><input type="email" value={formData.email || ''} onChange={(e) => updateField('email', e.target.value)} placeholder="you@example.com" /></label>
            <label><span>Phone</span><input type="tel" value={formData.phone || ''} onChange={(e) => updateField('phone', e.target.value)} placeholder="+92..." /></label>
            <label className="cms-field-full"><span>Address</span><input value={formData.address || ''} onChange={(e) => updateField('address', e.target.value)} /></label>
            <label className="cms-field-full"><span>Profile image URL</span><input type="url" value={formData.profile_image_url || ''} onChange={(e) => updateField('profile_image_url', e.target.value)} placeholder="https://..." /></label>
          </div>
          {formData.profile_image_url && <div className="cms-preview" style={{ width: 130 }}><img src={formData.profile_image_url} alt="Profile preview" /></div>}
          <div className="cms-form-actions">
            <button type="submit" className="cms-btn cms-btn-primary" disabled={saving}>{saving ? <><span className="cms-spinner dark" /> Saving…</> : 'Save'}</button>
          </div>
        </div>
      </form>
      {contact && (
        <div className="cms-single-row">
          <div className="cms-single-left">
            {contact.profile_image_url
              ? <img className="cms-profile-thumb" src={contact.profile_image_url} alt="Current profile" />
              : <div className="cms-profile-thumb placeholder">AA</div>}
            <div>
              <h3>{contact.email || 'No email set'}</h3>
              <p>{contact.phone || contact.address || 'No other contact details set.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderActiveTab = () => {
    if (activeTab === 'projects') return renderProjects();
    if (activeTab === 'certificates') return renderCertificates();
    if (activeTab === 'skills') return renderSkills();
    if (activeTab === 'social') return renderSocial();
    if (activeTab === 'resume') return renderResume();
    if (activeTab === 'experience') return renderExperience();
    return renderContact();
  };

  if (loading) {
    return (
      <main className="cms" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="cms-login-loading">
          <span className="cms-spinner" />
          <span>Loading workspace…</span>
        </div>
      </main>
    );
  }

  const activeLabel = TABS.find((t) => t.value === activeTab)?.label || 'Projects';

  return (
    <div className="cms cms-app-v2" ref={rootRef}>
      <header className="cms-navbar" ref={navbarRef}>
        <div className="cms-navbar-inner">
          <a className="cms-navbar-brand" href="/" aria-label="Back to portfolio">
            <span className="brand-mark">AA</span>
            <span className="cms-navbar-brand-text">Abdulrahman Awan</span>
          </a>

          <nav className="cms-navbar-tabs" aria-label="Content sections">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              const count = counts[tab.value];
              return (
                <button
                  key={tab.value}
                  type="button"
                  className={`cms-navbar-tab ${isActive ? 'active' : ''}`}
                  onClick={() => selectTab(tab.value)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="cms-navbar-tab-icon"><Icon name={tab.icon} /></span>
                  <span>{tab.label}</span>
                  {count > 0 && <span className="cms-navbar-tab-count">{count}</span>}
                </button>
              );
            })}
          </nav>

          <div className="cms-navbar-right">
            <a className="cms-navbar-link" href="/" target="_blank" rel="noreferrer">
              View site <Icon name="external" />
            </a>
            <div className="cms-navbar-user">
              {user?.photoURL
                ? <img className="cms-navbar-avatar" src={user.photoURL} alt="" />
                : <div className="cms-navbar-avatar fallback">AA</div>}
              <button type="button" className="cms-navbar-logout" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="cms-main-v2" ref={bodyRef}>
        <div className="cms-container">
          {message.text && (
            <div className={`cms-alert ${message.type || ''}`} role="alert">
              <p>{message.text}</p>
              <button type="button" onClick={() => setMessage({ type: '', text: '' })} aria-label="Dismiss">×</button>
            </div>
          )}

          <div className="cms-mobile-crumb cms-mono">
            ~/portfolio/admin/<b>{activeLabel}</b>
          </div>

          {renderActiveTab()}
        </div>
      </main>

      <nav className="cms-bottom-nav" ref={bottomNavRef} aria-label="Content sections">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              className={`cms-bottom-item ${isActive ? 'active' : ''}`}
              onClick={() => selectTab(tab.value)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon name={tab.icon} />
              <span className="cms-bottom-label">{tab.short}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminDashboard;