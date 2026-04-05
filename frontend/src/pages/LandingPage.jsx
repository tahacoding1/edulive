import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

/* ── Smooth scroll helper ── */
const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

/* ── DEFAULT fallback content ── */
const DEFAULT = {
  hero: {
    badge: '🚀 Next-Gen Virtual Learning',
    title: 'Teach & Learn Without Limits',
    subtitle: 'EduLive brings your classroom online with real-time whiteboard, live video, assignments, and smart collaboration — all in one place.',
    cta: 'Start Teaching Free', ctaSub: 'Join as Student',
    stats: [{ value:'10K+', label:'Active Users' },{ value:'500+', label:'Classrooms' },{ value:'99.9%', label:'Uptime' },{ value:'4.9★', label:'Rating' }],
  },
  about: {
    tag: 'About EduLive', title: 'Built for Modern Education',
    description: 'EduLive was created to solve the biggest challenge in online education — engagement. We combine real-time collaboration tools with an intuitive interface so teachers can focus on teaching.',
    features: [
      { icon:'🎯', title:'Purpose-Built',    desc:'Designed specifically for educators and students, not repurposed from generic video tools.' },
      { icon:'⚡', title:'Real-Time',        desc:'Zero-latency whiteboard, instant messaging, and live video keep everyone in sync.' },
      { icon:'🔒', title:'Secure',           desc:'Password-protected rooms, JWT authentication, and role-based access control.' },
      { icon:'📱', title:'Works Everywhere', desc:'Fully responsive — use on desktop, tablet, or mobile without installing anything.' },
    ],
  },
  services: {
    tag: 'What We Offer', title: 'Everything for Your Virtual Classroom',
    items: [
      { icon:'🖊', title:'Live Whiteboard',   desc:'Real-time collaborative canvas synced across all participants instantly.' },
      { icon:'📹', title:'HD Video & Audio',  desc:'Start camera or share screen. Crystal-clear peer-to-peer streaming.' },
      { icon:'💬', title:'Live Chat',         desc:'Persistent chat history saved to database. Full conversation always available.' },
      { icon:'📋', title:'Assignments',       desc:'Post tasks with deadlines. Students submit files. Teachers review all submissions.' },
      { icon:'👥', title:'Participant Control',desc:'Manage raised hands, mute participants, remove students, allow speaking.' },
      { icon:'🔐', title:'Secure Rooms',      desc:'Unique Room ID and randomly generated password for every classroom.' },
    ],
  },
  faq: {
    tag: 'FAQ', title: 'Frequently Asked Questions',
    items: [
      { q:'How do students join a classroom?', a:'Students receive a Room ID and Password from their teacher and enter them on the dashboard.' },
      { q:'Can I use EduLive on mobile?', a:'Yes! EduLive is fully responsive and works on smartphones, tablets, and desktops.' },
      { q:'Is there a class size limit?', a:'Currently EduLive supports up to 50 simultaneous participants per classroom.' },
      { q:'Where are assignments stored?', a:'All assignments, submissions, and messages are stored securely in MongoDB.' },
      { q:'How does the admin panel work?', a:'Admins manage all users, assign roles, view classrooms, and edit website content.' },
    ],
  },
  contact: {
    tag: 'Get in Touch', title: "We'd Love to Hear From You",
    subtitle: 'Have a question, suggestion, or need help? Reach out.',
    email: 'support@edulive.app', phone: '+1 (555) 123-4567',
    address: '123 Innovation Drive, Silicon Valley, CA',
  },
};

/* ── Reusable section tag ── */
function Tag({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-accent text-xs font-bold tracking-wider uppercase mb-4">
      {children}
    </span>
  );
}

/* ── FAQ Accordion ── */
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl transition-all duration-200 ${open ? 'border-primary/40 bg-card' : 'border-border bg-elevated hover:border-borderLight'}`}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="text-textBase font-semibold text-sm pr-4">{q}</span>
        <span className={`text-textDim text-lg transition-transform duration-200 shrink-0 ${open ? 'rotate-45 text-primary' : ''}`}>+</span>
      </button>
      {open && <p className="px-5 pb-4 text-textDim text-sm leading-relaxed border-t border-border/50 pt-3">{a}</p>}
    </div>
  );
}

/* ── Contact Form ── */
function ContactForm({ data }) {
  const [form,    setForm]    = useState({ name:'', email:'', message:'' });
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    setTimeout(() => { setSent(true); setLoading(false); }, 1000);
  };

  if (sent) return (
    <div className="card p-8 text-center animate-scale-in">
      <div className="text-5xl mb-3">✅</div>
      <p className="text-success font-bold text-lg mb-1">Message Sent!</p>
      <p className="text-textDim text-sm">We'll get back to you within 24 hours.</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="card p-7 flex flex-col gap-4">
      <h3 className="text-textBase font-bold text-lg">Send a Message</h3>
      <input className="input-field text-sm" placeholder="Your Name" value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      <input className="input-field text-sm" type="email" placeholder="Your Email" value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
      <textarea rows={4} className="input-field text-sm resize-none" placeholder="Your message…" value={form.message}
        onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
      <button type="submit" disabled={loading} className="btn-primary py-3 text-sm shadow-glow">
        {loading ? 'Sending…' : 'Send Message →'}
      </button>
    </form>
  );
}

/* ── Main Landing Page ── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [content,    setContent]    = useState(DEFAULT);
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);

  useEffect(() => {
    api.get('/content')
      .then(({ data }) => {
        if (data && data.content && Object.keys(data.content).length > 0) {
          setContent(prev => ({ ...prev, ...data.content }));
        }
      })
      .catch((err) => {
        console.error('Failed to fetch content:', err.message);
      });

    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const { hero, about, services, faq, contact } = content;

  const NAV_LINKS = [['About','about'],['Services','services'],['FAQ','faq'],['Contact','contact']];

  return (
    <div className="min-h-screen bg-bg font-sans text-textBase overflow-x-hidden">

      {/* ── STICKY NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-surface/95 backdrop-blur border-b border-border shadow-panel' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
          <div className="text-xl font-black gradient-text tracking-tight">◈ EduLive</div>
          <div className="hidden md:flex items-center gap-6 flex-1">
            {NAV_LINKS.map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="text-textDim text-sm font-medium hover:text-textBase transition-colors">{label}</button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3 ml-auto">
            <button onClick={() => navigate('/auth')} className="btn-ghost px-5 py-2 text-sm">Sign In</button>
            <button onClick={() => navigate('/auth')} className="btn-primary px-5 py-2 text-sm shadow-glow">Get Started →</button>
          </div>
          {/* Mobile menu btn */}
          <button onClick={() => setMenuOpen(o => !o)} className="md:hidden ml-auto text-textDim text-2xl">{menuOpen ? '✕' : '☰'}</button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-surface border-t border-border px-6 py-4 flex flex-col gap-3 animate-slide-down">
            {NAV_LINKS.map(([label, id]) => (
              <button key={id} onClick={() => { scrollTo(id); setMenuOpen(false); }}
                className="text-textDim text-sm font-medium text-left py-2 hover:text-textBase transition-colors">{label}</button>
            ))}
            <div className="flex gap-3 pt-2 border-t border-border">
              <button onClick={() => navigate('/auth')} className="btn-ghost flex-1 py-2.5 text-sm">Sign In</button>
              <button onClick={() => navigate('/auth')} className="btn-primary flex-1 py-2.5 text-sm">Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-16 pb-20 overflow-hidden bg-grid">
        {/* BG glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[900px] h-[900px] rounded-full -top-80 -right-80 opacity-30"
               style={{ background: 'radial-gradient(circle,#2979ff 0%,transparent 65%)' }} />
          <div className="absolute w-[600px] h-[600px] rounded-full bottom-0 left-0 opacity-20"
               style={{ background: 'radial-gradient(circle,#00d4ff 0%,transparent 65%)' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-accent text-sm font-semibold mb-8 animate-fade-in">
              {hero.badge}
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tight mb-6 animate-slide-up"
                style={{ animationDelay: '0.1s' }}>
              {hero.title.split(' ').slice(0, -2).join(' ')}{' '}
              <span className="gradient-text">{hero.title.split(' ').slice(-2).join(' ')}</span>
            </h1>
            <p className="text-textDim text-lg md:text-xl leading-relaxed mb-10 max-w-2xl animate-slide-up"
               style={{ animationDelay: '0.2s' }}>
              {hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <button onClick={() => navigate('/auth')}
                className="btn-primary px-8 py-4 text-base rounded-xl shadow-glow">
                {hero.cta} →
              </button>
              <button onClick={() => navigate('/auth')}
                className="btn-ghost px-8 py-4 text-base rounded-xl">
                {hero.ctaSub}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {hero.stats?.map(({ value, label }) => (
              <div key={label} className="card p-5 text-center">
                <p className="text-3xl font-black gradient-text">{value}</p>
                <p className="text-textDim text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <Tag>{about.tag}</Tag>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">{about.title}</h2>
            <p className="text-textDim text-lg leading-relaxed">{about.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {about.features?.map(({ icon, title, desc }) => (
              <div key={title} className="card p-6 hover:border-primary/40 transition-all duration-300 group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
                <h3 className="text-textBase font-bold text-base mb-2">{title}</h3>
                <p className="text-textDim text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="py-24 bg-bg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <Tag>{services.tag}</Tag>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">{services.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.items?.map(({ icon, title, desc }) => (
              <div key={title}
                className="card p-7 hover:border-primary/40 hover:bg-card/80 transition-all duration-300 group cursor-default">
                <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-2xl mb-5 group-hover:bg-primary/25 transition-colors">
                  {icon}
                </div>
                <h3 className="text-textBase font-bold text-base mb-2">{title}</h3>
                <p className="text-textDim text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-surface">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <Tag>{faq.tag}</Tag>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">{faq.title}</h2>
          </div>
          <div className="flex flex-col gap-3">
            {faq.items?.map(({ q, a }) => <FAQItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-24 bg-bg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <Tag>{contact.tag}</Tag>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3">{contact.title}</h2>
            <p className="text-textDim text-lg">{contact.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {/* Info */}
            <div className="flex flex-col gap-6">
              {[
                { icon:'📧', label:'Email',   val: contact.email,   href:`mailto:${contact.email}` },
                { icon:'📞', label:'Phone',   val: contact.phone,   href:`tel:${contact.phone}` },
                { icon:'📍', label:'Address', val: contact.address, href: null },
              ].map(({ icon, label, val, href }) => (
                <div key={label} className="flex items-start gap-4 card p-5">
                  <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-xl shrink-0">{icon}</div>
                  <div>
                    <p className="text-textMuted text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
                    {href ? (
                      <a href={href} className="text-textBase font-semibold text-sm hover:text-accent transition-colors">{val}</a>
                    ) : (
                      <p className="text-textBase font-semibold text-sm">{val}</p>
                    )}
                  </div>
                </div>
              ))}

              <div className="card p-6">
                <h3 className="text-textBase font-bold mb-4">Ready to get started?</h3>
                <button onClick={() => navigate('/auth')} className="btn-primary w-full py-3 text-sm shadow-glow">
                  Create Free Account →
                </button>
              </div>
            </div>

            <ContactForm data={contact} />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-surface border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xl font-black gradient-text tracking-tight">◈ EduLive</div>
          <div className="flex items-center gap-6">
            {NAV_LINKS.map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="text-textMuted text-sm hover:text-textDim transition-colors">{label}</button>
            ))}
          </div>
          <p className="text-textMuted text-xs">© {new Date().getFullYear()} EduLive. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
