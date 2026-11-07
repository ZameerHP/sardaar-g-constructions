'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  Menu,
  Plus,
  Minus,
  ShieldCheck,
  CalendarDays,
  Layers,
  Users,
  MessageSquare,
  Ruler,
  CheckCheck,
  HardHat,
  MapPin,
  Shield,
  Wrench,
  Umbrella,
  ClipboardCheck,
  Star,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
} from 'lucide-react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  areas,
  steps,
  industries,
  industryDetails,
  manufacturerCategories,
  formatPhoneDisplay,
  formatPhoneHref,
  formatEmailHref,
  type Content,
  type RecordData,
} from '@/lib/data';
import { QuoteForm } from './quote-form';
import { CinematicHero } from './hero';
import { MotionDirector } from './motion';
import { StairMotion } from './stair-motion';
import { SmoothScroll } from './smooth-scroll';
import { Turnstile } from './turnstile';

const nav = [
  ['Home', '/'],
  ['About', '/about'],
  ['Services', '/services'],
  ['Projects', '/projects'],
  ['Industries', '/industries'],
  ['Our Process', '/our-process'],
  ['Warranty', '/warranty'],
  ['Contact', '/contact'],
] as const;

export function ButtonLink({
  href = '/request-a-quote',
  children = 'Request a quote',
  className = '',
}: {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a className={('btn ' + className).trim()} href={href}>
      <span>{children}</span>
      <ArrowUpRight aria-hidden="true" />
    </a>
  );
}

function TextLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const isExternal = /^https?:\/\//i.test(href);
  return (
    <a
      className="text-link"
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
    >
      <span>{children}</span>
      <ArrowUpRight aria-hidden="true" />
    </a>
  );
}

function Brand() {
  return (
    <a
      className="brand"
      href="/"
      aria-label="Sardaar G Construction Ltd. home"
    >
      <div className="brand-logo-wrap">
        <img
          src="/images/logo-mark.webp"
          alt="Sardaar G Construction Ltd. emblem"
          width="52"
          height="52"
          decoding="async"
        />
      </div>
      <div className="brand-copy">
        <span className="brand-name">SARDAAR G</span>
        <span className="brand-tagline">CONSTRUCTION LTD.</span>
      </div>
    </a>
  );
}

export function Frame({
  children,
  content,
  closing = true,
}: {
  children: React.ReactNode;
  content: Content;
  closing?: boolean;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 32);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const isAuthOrAdmin = path.startsWith('/admin');
  const phoneDisplay = formatPhoneDisplay(content?.settings?.phone);
  const phoneHref = formatPhoneHref(content?.settings?.phone);
  const emailHref = formatEmailHref('info@sardaarg.ca');
  const instagramUrl =
    content?.settings?.instagram &&
    content.settings.instagram.startsWith('https://')
      ? content.settings.instagram
      : 'https://www.instagram.com/sardaarg_ltd/';

  return (
    <div className="public-site">
      <SmoothScroll />
      <StairMotion />
      <MotionDirector />
      <a className="skip" href="#main">
        Skip to content
      </a>

      <header
        className={
          'header shell' +
          (path === '/' ? ' header-home' : '') +
          (scrolled ? ' is-scrolled' : '')
        }
      >
        <Brand />

        <nav className="desktop-nav" aria-label="Main navigation">
          {nav.map(([name, href]) => {
            const isActive =
              path === href || (href !== '/' && path.startsWith(href + '/'));
            return (
              <a
                className={isActive ? 'active' : ''}
                aria-current={isActive ? 'page' : undefined}
                key={href}
                href={href}
              >
                {name}
              </a>
            );
          })}
        </nav>

        <div className="header-actions">
          <ButtonLink className="header-cta" />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className={'menu-trigger' + (open ? ' is-open' : '')}
                aria-label={
                  open ? 'Close navigation menu' : 'Open navigation menu'
                }
                aria-expanded={open}
                aria-controls="mobile-menu-drawer"
              >
                <span className="hamburger-lines" aria-hidden="true">
                  <span className="hamburger-line" />
                  <span className="hamburger-line" />
                  <span className="hamburger-line" />
                </span>
                <Menu className="hamburger-fallback-icon" aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent
              id="mobile-menu-drawer"
              data-lenis-prevent
              className="mobile-sheet p-8"
            >
              <div className="mobile-sheet-header">
                <Brand />
                <SheetTitle className="sr-only">
                  Sardaar G Construction
                </SheetTitle>
                <SheetDescription className="mobile-sheet-subtitle">
                  Exterior Cladding Solutions · British Columbia
                </SheetDescription>
              </div>

              <nav className="mobile-nav" aria-label="Mobile navigation">
                {nav.map(([name, href]) => {
                  const isActive =
                    path === href ||
                    (href !== '/' && path.startsWith(href + '/'));
                  return (
                    <a
                      key={href}
                      href={href}
                      className={isActive ? 'active' : ''}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => setOpen(false)}
                    >
                      <span>{name}</span>
                      <ArrowUpRight size={18} aria-hidden="true" />
                    </a>
                  );
                })}
              </nav>

              <div className="mobile-sheet-footer">
                <div className="mobile-contact-quick">
                  <a href={phoneHref} className="mobile-contact-pill">
                    <Phone size={16} aria-hidden="true" />
                    <span>{phoneDisplay}</span>
                  </a>
                  <a href={emailHref} className="mobile-contact-pill">
                    <Mail size={16} aria-hidden="true" />
                    <span>info@sardaarg.ca</span>
                  </a>
                </div>
                <a
                  className="btn mobile-cta-btn"
                  href="/request-a-quote"
                  onClick={() => setOpen(false)}
                >
                  <span>Request a quote</span>
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <span className="header-progress" aria-hidden="true" />
      </header>

      <main id="main">
        {children}
        {closing && (
          <section className="closing shell" aria-label="Project inquiry call to action">
            <div className="section-head">
              <div>
                <h2>
                  Let’s talk about
                  <br />
                  <em>your next project.</em>
                </h2>
                <p>
                  Send your drawings, project details or scope of work. Let’s
                  discuss your exterior cladding requirements.
                </p>
              </div>
              <ButtonLink className="dark" />
            </div>
          </section>
        )}
        {!isAuthOrAdmin && <ReviewSubmissionSection />}
      </main>

      <footer className="footer shell">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <Brand />
            <p className="footer-tagline">
              Exterior cladding solutions.
              <br />
              Built with care. Finished with pride.
              <br />
              British Columbia, Canada.
            </p>
          </div>
          <div className="footer-nav-col">
            <div className="label">Explore</div>
            <div className="footer-links">
              {nav.slice(1, 5).map(([n, h]) => (
                <a key={h} href={h}>
                  {n}
                </a>
              ))}
              {content.articles.length > 0 && <a href="/insights">Articles</a>}
            </div>
          </div>
          <div className="footer-nav-col">
            <div className="label">Working together</div>
            <div className="footer-links">
              <a href="/our-process">Our process</a>
              <a href="/warranty">Warranty coverage</a>
              <a href="/request-a-quote">Request a quote</a>
              <a href="/service-areas">Service areas</a>
              <a href="/contact">Contact</a>
            </div>
          </div>
          <div className="footer-nav-col">
            <div className="label">Get in touch</div>
            <div className="footer-links">
              <a href={phoneHref}>{phoneDisplay}</a>
              <a href={emailHref}>info@sardaarg.ca</a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
              <a href="/service-areas">
                {content.settings.service_area || 'Across British Columbia'}
              </a>
            </div>
          </div>
        </div>

        <div className="footer-wordmark" aria-hidden="true">
          <svg
            className="footer-wordmark-svg"
            viewBox="0 0 1280 175"
            preserveAspectRatio="xMidYMid meet"
            role="presentation"
          >
            <defs>
              <linearGradient id="footer-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f6e6c2" />
                <stop offset="50%" stopColor="#dfc184" />
                <stop offset="100%" stopColor="#b38b40" />
              </linearGradient>
            </defs>
            <text
              x="0"
              y="138"
              textLength="1276"
              lengthAdjust="spacing"
            >
              <tspan fill="#ebe8df">SARDAAR</tspan>
              <tspan dx="38" fill="url(#footer-gold-grad)">G.</tspan>
            </text>
          </svg>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Sardaar G Construction Ltd. All rights reserved.
          </span>
          <span className="footer-legal-links">
            <a href="/privacy">Privacy Policy</a>
            <span className="footer-divider" aria-hidden="true">/</span>
            <a href="/admin/login">Owner access</a>
          </span>
        </div>
      </footer>
    </div>
  );
}

function Heading({
  label,
  title,
  link,
  href,
}: {
  label: string;
  title: React.ReactNode;
  link?: string;
  href?: string;
}) {
  return (
    <div className="section-head scroll-reveal">
      <div>
        <div className="label">{label}</div>
        <h2>{title}</h2>
      </div>
      {link && href && <TextLink href={href}>{link}</TextLink>}
    </div>
  );
}

function Photo({
  name,
  className = '',
  alt,
  objectPosition,
}: {
  name: string;
  className?: string;
  caption?: boolean;
  alt?: string;
  objectPosition?: string;
}) {
  const defaultAlt =
    name === 'seattle-facade'
      ? 'Multi-family residential building with architectural metal and warm timber cladding'
      : name === 'timber-home'
        ? 'Custom residence featuring vertical cedar and fiber cement siding installation'
        : name === 'hero-foreground'
          ? 'Contemporary residential exterior with engineered rainscreen and timber soffits'
          : name === 'service-rainscreen-assembly'
            ? 'Engineered exterior wall rainscreen assembly with weather-resistive barrier and metal Z-girt strapping'
            : name === 'service-soffit-fascia'
              ? 'Wood-grain aluminum soffit overhang with recessed lighting and matte black metal fascia'
              : name === 'interlude-detail-facade'
                ? 'Precision architectural transition between vertical timber slats and matte black ribbed metal cladding'
                : 'Commercial building facade with dark architectural metal panels';
  return (
    <div className={('photo-frame ' + className).trim()}>
      <img
        src={name.startsWith('/') ? name : '/images/' + name + '.webp'}
        alt={alt || defaultAlt}
        loading="lazy"
        decoding="async"
        width="1200"
        height="1500"
        style={objectPosition ? { objectPosition } : undefined}
      />
    </div>
  );
}

function ServiceList({ content }: { content: Content }) {
  const [active, setActive] = useState(0);
  if (!content.services.length) {
    return (
      <p>
        Service information is being updated. Please contact us to discuss your
        project.
      </p>
    );
  }
  const selected =
    content.services[Math.max(0, active)] || content.services[0];

  return (
    <div className="services-layout">
      <div className="service-visual">
        <Photo
          key={selected.id}
          name={selected.image}
          alt={selected.imageAlt}
          className="service-photo service-photo-transition"
        />
        <div className="service-visual-label">
          <span>OUR EXPERTISE</span>
          <strong>{selected.title}</strong>
        </div>
      </div>
      <div>
        {content.services.map((s, i) => {
          const isOpen = active === i;
          return (
            <div
              className={'service-row' + (isOpen ? ' is-active' : '')}
              key={s.id}
            >
              <button
                type="button"
                id={'service-btn-' + s.id}
                aria-expanded={isOpen}
                aria-controls={'service-' + s.id}
                onClick={() => setActive(isOpen ? -1 : i)}
              >
                <span className="number">0{i + 1}</span>
                <h3>{s.title}</h3>
                {isOpen ? (
                  <Minus size={18} aria-hidden="true" />
                ) : (
                  <Plus size={18} aria-hidden="true" />
                )}
              </button>
              <div
                className={'service-expansion' + (isOpen ? ' expanded' : '')}
                id={'service-' + s.id}
                role="region"
                aria-labelledby={'service-btn-' + s.id}
                aria-hidden={!isOpen}
              >
                <div>
                  <div className="service-copy">
                    <p>{s.body}</p>
                    <TextLink href={'/services/' + s.id}>
                      Explore service
                    </TextLink>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Process({ expanded = false }: { expanded?: boolean }) {
  return (
    <div className="process-grid">
      {steps.map(([title, short, body], i) => (
        <article className="process-step scroll-reveal" key={title}>
          <span className="step-number">0{i + 1}</span>
          <h3>{title}</h3>
          <p>
            {short}
            {expanded && ' ' + body}
          </p>
        </article>
      ))}
    </div>
  );
}

function ProjectCards({ projects }: { projects: RecordData[] }) {
  return (
    <div className="project-grid">
      {projects.map((p, idx) => (
        <div key={p.id}>
          <a href={'/projects/' + p.slug} className="project-card-link">
            <div className="photo-frame project-card-media">
              <img
                src={p.data.cover}
                alt={p.data.coverAlt || p.title}
                loading="lazy"
                decoding="async"
                width="1200"
                height="900"
                style={{ objectPosition: p.data.focal || '50% 50%' }}
              />
              <div className="project-card-badges">
                <span className="project-sector-pill">
                  {p.data.type || 'Exterior Cladding'}
                </span>
                <span className="project-location-pill">
                  <MapPin size={12} aria-hidden="true" />
                  {p.data.location || 'British Columbia'}
                </span>
              </div>
            </div>
            <div className="project-info">
              <div>
                <h3>{p.title}</h3>
                {p.data.summary && (
                  <p className="project-card-summary">{p.data.summary}</p>
                )}
                <div className="project-meta-pills" aria-label="Project specifications">
                  <span>{p.data.materials || 'Engineered Cladding Assembly'}</span>
                </div>
              </div>
              <span className="label gold">
                {String(idx + 1).padStart(2, '0')}
              </span>
            </div>
          </a>
        </div>
      ))}
    </div>
  );
}

function ReviewSubmissionSection() {
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [token, setToken] = useState('');
  const [resetKey, setResetKey] = useState(0);

  return (
    <section
      className="section shell review-hub-section"
      aria-labelledby="review-hub-heading"
    >
      <div className="review-hub-header">
        <div className="label">Client Feedback</div>
        <h2 id="review-hub-heading">
          Share Your Experience.
          <br />
          <em>Work With Sardaar G.</em>
        </h2>
        <p>
          We value feedback from our clients, general contractors, and project
          partners across British Columbia. Write a review to share your project
          experience.
        </p>
      </div>
      <div className="review-form-wrap">
        <form
          onSubmit={async e => {
            e.preventDefault();
            setBusy(true);
            setStatus('idle');
            setMsg('');
            const f = new FormData(e.currentTarget);
            try {
              const r = await fetch('/api/reviews/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  client_name: f.get('client_name'),
                  company: f.get('company'),
                  project_type: f.get('project_type'),
                  rating,
                  review: f.get('review'),
                  turnstile: token || undefined,
                }),
              });
              const res = (await r.json()) as {
                error?: string;
                message?: string;
              };
              if (!r.ok)
                throw new Error(res.error || 'Failed to submit review');
              setStatus('success');
              setMsg(res.message || 'Thank you! Your review has been submitted.');
              (e.target as HTMLFormElement).reset();
              setRating(5);
              setToken('');
              setResetKey(k => k + 1);
            } catch (err: any) {
              setStatus('error');
              setMsg(
                err.message ||
                  'Unable to submit your review. Please try again.',
              );
            } finally {
              setBusy(false);
            }
          }}
          className="form-grid"
        >
          <label className="field">
            <span>Name *</span>
            <input
              name="client_name"
              type="text"
              placeholder="Your full name"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
            />
          </label>
          <label className="field">
            <span>Company / Firm</span>
            <input
              name="company"
              type="text"
              placeholder="e.g. West Coast Homes"
              maxLength={100}
              autoComplete="organization"
            />
          </label>
          <label className="field">
            <span>Project Type</span>
            <input
              name="project_type"
              type="text"
              placeholder="e.g. Custom Residential Cladding"
              maxLength={100}
            />
          </label>
          <div className="field">
            <span id="rating-group-label">Rating *</span>
            <div
              className="rating-stars-select"
              role="group"
              aria-labelledby="rating-group-label"
            >
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={
                    'rating-star-btn ' + (star <= rating ? 'is-active' : '')
                  }
                  aria-label={star + ' star' + (star > 1 ? 's' : '')}
                  aria-pressed={star === rating}
                >
                  <Star
                    fill={star <= rating ? 'currentColor' : 'none'}
                    size={22}
                    aria-hidden="true"
                  />
                </button>
              ))}
              <span className="rating-count-label">{rating} / 5 Stars</span>
            </div>
          </div>
          <label className="field wide">
            <span>Review / Comments *</span>
            <textarea
              name="review"
              data-lenis-prevent
              placeholder="Describe your experience with Sardaar G Construction (workmanship, scheduling, communication, finished results)..."
              required
              minLength={10}
              maxLength={3000}
            />
          </label>
          <div className="field wide">
            <Turnstile
              action="review-submission"
              onToken={setToken}
              resetKey={resetKey}
            />
          </div>
          {status === 'success' && (
            <div className="form-message field wide" role="status">
              {msg}
            </div>
          )}
          {status === 'error' && (
            <div className="form-message error field wide" role="alert">
              {msg}
            </div>
          )}
          <div className="field wide" style={{ marginTop: 10 }}>
            <button className="btn dark designer-submit-btn" type="submit" disabled={busy}>
              <span>{busy ? 'Submitting Review…' : 'Submit Client Review'}</span>
              <ArrowUpRight aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function MaterialsBlock({ content }: { content: Content }) {
  const items = content.manufacturerDetails?.length
    ? content.manufacturerDetails.map(m => ({
        key: m.id,
        name: m.brand_name,
        category:
          m.category ||
          manufacturerCategories[m.brand_name] ||
          'Exterior Cladding System',
        logo: m.logo,
        logoAlt: m.logo_alt || m.brand_name,
        website: m.website,
      }))
    : content.manufacturers.map(name => ({
        key: name,
        name,
        category:
          manufacturerCategories[name] || 'Exterior Cladding System',
        logo: '',
        logoAlt: name,
        website: '',
      }));

  return (
    <div className="materials">
      <div className="materials-header">
        <div>
          <div className="label">Materials &amp; Manufacturers</div>
          <h3>Specified materials. Professional installation.</h3>
        </div>
        <p>
          We work with leading manufacturers and can install products according
          to project specifications.
        </p>
      </div>

      <div
        className="manufacturer-list"
        role="list"
        aria-label="Supported exterior material manufacturers"
      >
        {items.map(item => {
          const inner = (
            <>
              {item.logo ? (
                <div className="manufacturer-logo-slot">
                  <img
                    src={item.logo}
                    alt={item.logoAlt}
                    loading="lazy"
                    decoding="async"
                    width="110"
                    height="40"
                  />
                </div>
              ) : null}
              <div className="manufacturer-card-copy">
                <strong className="manufacturer-name">{item.name}</strong>
                <span className="manufacturer-category">{item.category}</span>
              </div>
            </>
          );

          return (
            <div
              className="manufacturer-card"
              role="listitem"
              key={item.key}
            >
              {item.website ? (
                <a
                  href={item.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="manufacturer-card-link"
                >
                  {inner}
                </a>
              ) : (
                inner
              )}
            </div>
          );
        })}
      </div>

      <p className="materials-footnote">
        Brand names are trademarks of their respective owners.
      </p>
    </div>
  );
}

export function HomePage({ content }: { content: Content }) {
  const featuredProjects = content.projects.filter(p => p.data.featured).length
    ? content.projects.filter(p => p.data.featured).slice(0, 4)
    : content.projects.slice(0, 3);

  return (
    <Frame content={content}>
      <CinematicHero />

      <div className="positioning shell" aria-label="Primary sectors">
        {industries.map(([t]) => (
          <a
            key={t}
            href={'/industries#' + t.toLowerCase().replaceAll(' ', '-')}
          >
            {t}
          </a>
        ))}
      </div>

      <section id="intro" className="section shell intro">
        <div className="scroll-reveal">
          <div className="label">01 / The way we build</div>
          <h2>
            Built on experience.
            <br />
            <em>Focused on quality.</em>
          </h2>
          <p>
            We specialize in exterior cladding and siding installation
            throughout British Columbia. Working with builders, developers,
            general contractors and homeowners, we bring a careful eye to every
            exterior.
          </p>
          <p>
            Our goal is simple: complete every project safely, efficiently and
            to a high standard — with minimal callbacks.
          </p>
          <TextLink href="/about">About Sardaar G</TextLink>
        </div>
        <div className="architecture-collage">
          <Photo
            name="service-rainscreen-assembly"
            className="collage-main"
            objectPosition="50% 50%"
          />
          <Photo
            name="service-soffit-fascia"
            className="collage-detail"
            objectPosition="50% 45%"
          />
          <div className="collage-note">
            <Layers size={24} strokeWidth={1.2} aria-hidden="true" />
            <span>
              Considered materials.
              <br />
              Careful installation.
            </span>
          </div>
        </div>
      </section>

      <section className="section shell dark-section work-section">
        <Heading
          label="02 / A closer look"
          title={
            <>
              Our work.
              <br />
              <em>In detail.</em>
            </>
          }
          link="View all projects"
          href="/projects"
        />
        {content.projects.length ? (
          <ProjectCards projects={featuredProjects} />
        ) : (
          <div className="project-grid">
            <div>
              <a href="/projects" className="project-card-link">
                <Photo name="project-west-van-residence" objectPosition="50% 48%" />
                <div className="project-info">
                  <div>
                    <h3>Material. Rhythm. Detail.</h3>
                    <div className="project-meta-pills">
                      <span>West Vancouver, BC</span>
                      <span className="meta-dot" aria-hidden="true">·</span>
                      <span>Residential Exterior</span>
                      <span className="meta-dot" aria-hidden="true">·</span>
                      <span>Longboard &amp; Hardie Panel</span>
                    </div>
                  </div>
                  <span className="label gold">01</span>
                </div>
              </a>
            </div>
            <div>
              <a href="/projects" className="project-card-link">
                <Photo name="project-richmond-commercial" objectPosition="50% 48%" />
                <div className="project-info">
                  <div>
                    <h3>A precise exterior.</h3>
                    <div className="project-meta-pills">
                      <span>Metro Vancouver, BC</span>
                      <span className="meta-dot" aria-hidden="true">·</span>
                      <span>Commercial Envelope</span>
                      <span className="meta-dot" aria-hidden="true">·</span>
                      <span>Architectural ACM &amp; Rainscreen</span>
                    </div>
                  </div>
                  <span className="label gold">02</span>
                </div>
              </a>
            </div>
          </div>
        )}
      </section>

      <section className="section shell expertise-section">
        <Heading
          label="03 / Our expertise"
          title={
            <>
              Exterior systems.
              <br />
              <em>Installed with precision.</em>
            </>
          }
        />
        <ServiceList content={content} />
      </section>

      <section className="section interlude shell">
        <img
          src="/images/interlude-detail-facade.webp"
          alt="Close-up architectural detail of vertical timber slats meeting dark charcoal ribbed metal cladding panels"
          loading="lazy"
          decoding="async"
          width="1400"
          height="900"
        />
        <div className="scroll-reveal">
          <div className="label gold">Craftsmanship, up close</div>
          <h2>
            The difference
            <br />
            <em>is in the details.</em>
          </h2>
          <p>
            Clean transitions. Aligned panels. Thoughtful finishing. We take
            pride in getting the job done right the first time.
          </p>
          <TextLink href="/services/architectural-details">
            Explore architectural details
          </TextLink>
        </div>
      </section>

      <section className="section shell capabilities-section">
        <Heading
          label="04 / Why Sardaar G"
          title={
            <>
              A contractor you
              <br />
              <em>can build with.</em>
            </>
          }
        />
        <div className="trust-grid">
          {(
            [
              [
                Layers,
                'Experienced installation',
                'Hands-on knowledge of siding and exterior systems.',
              ],
              [
                CalendarDays,
                'Reliable scheduling',
                'Planning and coordination around your programme.',
              ],
              [
                CheckCheck,
                'Quality workmanship',
                'A consistent focus on the finished result.',
              ],
              [
                Users,
                'Professional crews',
                'Organised teams and respect for your site.',
              ],
              [
                HardHat,
                'Safety first',
                'Attention to site requirements and safe work practices.',
              ],
              [
                MessageSquare,
                'Clear communication',
                'Practical coordination at every project stage.',
              ],
              [
                Ruler,
                'Attention to detail',
                'Careful alignment, transitions and finishing.',
              ],
              [
                ShieldCheck,
                'Fewer callbacks',
                'Getting the details right is our operating priority.',
              ],
            ] as const
          ).map(([Icon, t, d]) => (
            <article key={t} className="scroll-reveal">
              <Icon aria-hidden="true" />
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell dark-section process-section">
        <Heading
          label="05 / From plans to completion"
          title={
            <>
              Clear process.
              <br />
              <em>Reliable execution.</em>
            </>
          }
          link="How we work"
          href="/our-process"
        />
        <Process />
      </section>

      <section className="section shell sectors-section">
        <Heading
          label="06 / Built for your sector"
          title="The right team for your build."
        />
        <IndustryBlocks />
        <MaterialsBlock content={content} />
      </section>

      {content.testimonials.length > 0 && (
        <section className="section shell testimonials-section-wrap">
          <Heading
            label="Customer reviews"
            title={
              <>
                Client feedback.
                <br />
                <em>Proven quality.</em>
              </>
            }
          />
          <div className="testimonials-section">
            {content.testimonials.map(t => (
              <blockquote key={t.id}>
                <h2>“{t.data.body}”</h2>
                <p>
                  {t.title}
                  {t.data.company ? ' · ' + t.data.company : ''}
                  {t.data.projectType ? ' / ' + t.data.projectType : ''}
                </p>
                {t.data.rating && (
                  <p aria-label={t.data.rating + ' out of 5 stars'}>
                    {'★'.repeat(t.data.rating)}
                  </p>
                )}
              </blockquote>
            ))}
          </div>
        </section>
      )}

      <section className="section shell dark-section coverage">
        <div>
          <div className="label">07 / Our reach</div>
          <h2>
            Across
            <br />
            British Columbia.
          </h2>
          <p style={{ marginTop: 25 }}>
            Local knowledge. A broader reach.
            <br />
            Available to travel for larger projects.
          </p>
        </div>
        <div className="area-list">
          {areas.map(a => (
            <a href="/service-areas" key={a}>
              <span>{a}</span>
              <ArrowUpRight size={19} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>
    </Frame>
  );
}

const industryMedia: { src: string; pos: string; alt: string }[] = [
  {
    src: '/images/timber-home.webp',
    pos: '50% 45%',
    alt: 'Custom residential exterior with architectural wood-look and fiber cement siding',
  },
  {
    src: '/images/seattle-facade.webp',
    pos: '48% 32%',
    alt: 'Multi-family residential development with coordinated rainscreen and panel cladding',
  },
  {
    src: '/images/black-commercial.webp',
    pos: '52% 48%',
    alt: 'Commercial building envelope featuring dark architectural metal facade systems',
  },
  {
    src: '/images/service-rainscreen-assembly.webp',
    pos: '50% 48%',
    alt: 'New construction engineered rainscreen and exterior cladding installation in British Columbia',
  },
];

function IndustryBlocks() {
  return (
    <div className="industry-grid">
      {industryDetails.map((sector, i) => {
        const media = industryMedia[i] || industryMedia[0];
        return (
          <article key={sector.id} id={sector.id}>
            <div className="industry-photo">
              <img
                src={media.src}
                alt={media.alt}
                loading="lazy"
                decoding="async"
                width="600"
                height="420"
                style={{ objectPosition: media.pos }}
              />
            </div>
            <span className="label">0{i + 1} · {sector.subtitle}</span>
            <h3>{sector.title}</h3>
            <p>{sector.summary}</p>
            <div className="sector-card-tags">
              {sector.systems.slice(0, 3).map(sys => (
                <span key={sys} className="sector-mini-tag">{sys}</span>
              ))}
            </div>
            <TextLink href={'/industries#' + sector.id}>
              Explore {sector.title.toLowerCase()} scope
            </TextLink>
          </article>
        );
      })}
    </div>
  );
}

function IndustriesShowcase() {
  return (
    <div className="sector-dossier-list">
      {industryDetails.map((sector, i) => (
        <article
          key={sector.id}
          id={sector.id}
          className={'sector-dossier-card' + (i % 2 === 1 ? ' is-reversed' : '')}
        >
          <div className="sector-dossier-media">
            <img
              src={sector.image}
              alt={sector.alt}
              loading="lazy"
              decoding="async"
              width="900"
              height="640"
            />
            <span className="sector-dossier-badge">
              Sector 0{i + 1} · {sector.title}
            </span>
          </div>
          <div className="sector-dossier-body">
            <div className="label">0{i + 1} / {sector.subtitle}</div>
            <h2>{sector.title} Exterior Systems</h2>
            <p className="sector-dossier-lead">{sector.body}</p>

            <div className="sector-dossier-columns">
              <div className="sector-scope-box">
                <h4>Typical Scope &amp; Deliverables</h4>
                <ul>
                  {sector.deliverables.map(item => (
                    <li key={item}>
                      <CheckCheck size={16} aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="sector-systems-box">
                <h4>Specified Systems &amp; Assemblies</h4>
                <div className="sector-system-pills">
                  {sector.systems.map(sys => (
                    <span key={sys} className="sector-system-pill">
                      {sys}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="sector-dossier-actions">
              <ButtonLink
                href={'/request-a-quote?type=' + encodeURIComponent(sector.title)}
              >
                Request {sector.title} Quote
              </ButtonLink>
              <a
                className="btn outline dark"
                href={'/projects?type=' + encodeURIComponent(sector.title)}
              >
                <span>View {sector.title} Projects</span>
                <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function InnerHero({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="inner-hero shell">
      <a className="inner-breadcrumb" href="/">
        Home <span>/</span>
      </a>
      <div className="label">{label}</div>
      <h1 className="reveal">{title}</h1>
      {description && <p>{description}</p>}
    </section>
  );
}

export function Portfolio({ content }: { content: Content }) {
  const [filter, setFilter] = useState('All');
  useEffect(() => {
    const read = () =>
      setFilter(new URLSearchParams(location.search).get('type') || 'All');
    read();
    addEventListener('popstate', read);
    return () => removeEventListener('popstate', read);
  }, []);

  const categories = [
    'All',
    ...new Set(content.projects.map(p => p.data.type).filter(Boolean)),
  ];
  const filtered = content.projects.filter(
    p => filter === 'All' || p.data.type === filter,
  );

  function change(v: string) {
    setFilter(v);
    history.pushState(
      {},
      '',
      v === 'All' ? '/projects' : '/projects?type=' + encodeURIComponent(v),
    );
  }

  return (
    <div className="portfolio-showcase">
      <div className="portfolio-stats-bar" aria-label="Portfolio overview metrics">
        <div className="portfolio-stat-item">
          <span className="portfolio-stat-value">
            {String(content.projects.length).padStart(2, '0')}
          </span>
          <span className="portfolio-stat-label">Featured BC Case Studies</span>
        </div>
        <div className="portfolio-stat-item">
          <span className="portfolio-stat-value">Part 5 &amp; 9</span>
          <span className="portfolio-stat-label">BC Building Code Rainscreen</span>
        </div>
        <div className="portfolio-stat-item">
          <span className="portfolio-stat-value">07+</span>
          <span className="portfolio-stat-label">Approved Cladding Manufacturers</span>
        </div>
        <div className="portfolio-stat-item">
          <span className="portfolio-stat-value">5 Regions</span>
          <span className="portfolio-stat-label">Lower Mainland to BC Interior</span>
        </div>
      </div>

      {content.projects.length > 0 && (
        <div className="portfolio-filter-bar">
          <div className="portfolio-filter-heading">
            <span className="label">Filter by sector</span>
            <p>
              Showing <strong>{filtered.length}</strong> of{' '}
              <strong>{content.projects.length}</strong> completed &amp; active exterior packages
            </p>
          </div>
          <div className="filters" aria-label="Filter projects">
            {categories.map(c => {
              const count =
                c === 'All'
                  ? content.projects.length
                  : content.projects.filter(p => p.data.type === c).length;
              return (
                <button
                  type="button"
                  className={'filter ' + (filter === c ? 'selected' : '')}
                  key={c}
                  onClick={() => change(c)}
                  aria-pressed={filter === c}
                >
                  <span>{c === 'All' ? 'All Projects' : c}</span>
                  <span className="filter-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length ? (
        <div className="portfolio-case-grid">
          {filtered.map((p, idx) => (
            <article key={p.id} className="portfolio-case-card">
              <a
                href={'/projects/' + p.slug}
                className="portfolio-case-media"
                aria-label={'View case study for ' + p.title}
              >
                <img
                  src={p.data.cover}
                  alt={p.data.coverAlt || p.title}
                  loading="lazy"
                  decoding="async"
                  width="1200"
                  height="820"
                  style={{ objectPosition: p.data.focal || '50% 50%' }}
                />
                <div className="portfolio-case-overlays">
                  <span className="portfolio-sector-badge">
                    {p.data.type || 'Exterior Cladding'}
                  </span>
                  <span className="portfolio-status-badge">
                    {p.data.status || 'Completed'}
                    {p.data.year ? ' · ' + p.data.year : ''}
                  </span>
                </div>
                <div className="portfolio-location-strip">
                  <MapPin size={14} aria-hidden="true" />
                  <span>{p.data.location || 'British Columbia'}</span>
                </div>
              </a>

              <div className="portfolio-case-body">
                <div className="portfolio-case-kicker">
                  Case Study {String(idx + 1).padStart(2, '0')}
                </div>
                <h3>
                  <a href={'/projects/' + p.slug}>{p.title}</a>
                </h3>
                <p className="portfolio-case-summary">
                  {p.data.summary || p.data.scope}
                </p>

                <dl className="case-spec-matrix">
                  <div className="case-spec-row">
                    <dt>Primary Cladding</dt>
                    <dd>{p.data.materials || 'Engineered Cladding System'}</dd>
                  </div>
                  {p.data.rainscreen && (
                    <div className="case-spec-row">
                      <dt>Rainscreen &amp; WRB</dt>
                      <dd>{p.data.rainscreen}</dd>
                    </div>
                  )}
                  {p.data.trimSystem && (
                    <div className="case-spec-row">
                      <dt>Architectural Details</dt>
                      <dd>{p.data.trimSystem}</dd>
                    </div>
                  )}
                </dl>

                {Array.isArray(p.data.deliverables) && p.data.deliverables.length > 0 && (
                  <ul className="case-deliverables-preview">
                    {p.data.deliverables.slice(0, 2).map((d: string) => (
                      <li key={d}>
                        <CheckCheck size={14} aria-hidden="true" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="portfolio-case-footer">
                  <a className="btn dark" href={'/projects/' + p.slug}>
                    <span>View Case Study</span>
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                  <a
                    className="portfolio-quote-shortcut"
                    href={'/request-a-quote?project=' + encodeURIComponent(p.title)}
                  >
                    <span>Discuss similar scope</span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="label">Our portfolio</div>
          <h2>
            {content.projects.length
              ? 'No matching projects.'
              : content.unavailable
                ? 'The portfolio is temporarily unavailable.'
                : 'Our project portfolio.'}
          </h2>
          <p>
            {content.projects.length
              ? 'Choose another category to explore our work.'
              : content.unavailable
                ? 'Please try again shortly.'
                : 'Explore our exterior cladding systems and installation scope. Contact our team to discuss your project requirements or request drawings.'}
          </p>
          {content.projects.length ? (
            <button
              type="button"
              className="btn"
              style={{ marginTop: 25 }}
              onClick={() => change('All')}
            >
              <span>Reset filters</span>
            </button>
          ) : (
            <div style={{ marginTop: 25 }}>
              <ButtonLink />
            </div>
          )}
        </div>
      )}

      <InteractiveBeforeAfter
        pairs={content.projects
          .filter(p => p.data.before && p.data.after)
          .map(p => ({
            title: p.title,
            before: p.data.before,
            after: p.data.after,
            beforeAlt: p.data.beforeAlt || p.title + ' before',
            afterAlt: p.data.afterAlt || p.title + ' after',
          }))}
      />
    </div>
  );
}

function Gallery({ media }: { media: any[] }) {
  const [active, setActive] = useState<number | null>(null);
  const x = useRef(0);
  return (
    <>
      <div className="gallery-grid">
        {media.map((m, i) => (
          <button
            type="button"
            key={m.url}
            onClick={() => setActive(i)}
            aria-label={'Open ' + (m.alt || 'project photo ' + (i + 1))}
          >
            <img
              src={m.url}
              alt={m.alt || 'Project gallery photo'}
              loading="lazy"
              decoding="async"
            />
          </button>
        ))}
      </div>
      <Dialog open={active !== null} onOpenChange={o => !o && setActive(null)}>
        <DialogContent
          className="sm:max-w-[90vw] max-h-[95vh]"
          onKeyDown={e => {
            if (e.key === 'ArrowRight')
              setActive(((active ?? 0) + 1) % media.length);
            if (e.key === 'ArrowLeft')
              setActive(((active ?? 0) - 1 + media.length) % media.length);
          }}
        >
          <DialogTitle>Project gallery</DialogTitle>
          <DialogDescription>
            {active !== null
              ? media[active]?.caption ||
                `Image ${active + 1} of ${media.length}`
              : ''}
          </DialogDescription>
          {active !== null && (
            <img
              className="lightbox-image"
              src={media[active]?.url}
              alt={media[active]?.alt || 'Project photo'}
              onTouchStart={e => (x.current = e.changedTouches[0].clientX)}
              onTouchEnd={e => {
                const d = x.current - e.changedTouches[0].clientX;
                if (Math.abs(d) > 60)
                  setActive(
                    (active + (d > 0 ? 1 : -1) + media.length) % media.length,
                  );
              }}
            />
          )}
          <div className="flex justify-between">
            <button
              type="button"
              className="filter"
              onClick={() =>
                setActive(((active ?? 0) - 1 + media.length) % media.length)
              }
            >
              Previous
            </button>
            <button
              type="button"
              className="filter"
              onClick={() => setActive(((active ?? 0) + 1) % media.length)}
            >
              Next
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function InteractiveBeforeAfter({
  pairs,
  before = '/images/seattle-facade.webp',
  after = '/images/timber-home.webp',
  beforeAlt = 'Original exterior facade before cladding installation',
  afterAlt = 'Completed exterior cladding transformation by Sardaar G Construction',
}: {
  pairs?: {
    title: string;
    before: string;
    after: string;
    beforeAlt?: string;
    afterAlt?: string;
  }[];
  before?: string;
  after?: string;
  beforeAlt?: string;
  afterAlt?: string;
}) {
  const list =
    pairs && pairs.length > 0
      ? pairs
      : [
          {
            title: 'Timber & Metal Transformation',
            before,
            after,
            beforeAlt,
            afterAlt,
          },
        ];
  const [idx, setIdx] = useState(0);
  const current = list[idx] || list[0];
  const [pos, setPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useRef((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    setPos((x / rect.width) * 100);
  });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove.current(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || !e.touches[0]) return;
      handleMove.current(e.touches[0].clientX);
    };
    const onEnd = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging]);

  return (
    <div className="before-after-section">
      <div className="before-after-header">
        <div className="label">Project Transformation</div>
        <h2>
          See the Transformation.
          <br />
          <em>From Existing to Exceptional.</em>
        </h2>
        <p>
          Drag the slider to compare the original exterior with the completed
          transformation.
        </p>
      </div>
      {list.length > 1 && (
        <div
          className="transformation-selector"
          role="tablist"
          aria-label="Transformation projects"
        >
          {list.map((p, i) => (
            <button
              type="button"
              key={p.title + i}
              className={'transformation-btn ' + (idx === i ? 'active' : '')}
              onClick={() => {
                setIdx(i);
                setPos(50);
              }}
              role="tab"
              aria-selected={idx === i}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}
      <div
        ref={containerRef}
        className="comparison-container"
        onMouseDown={e => {
          setIsDragging(true);
          handleMove.current(e.clientX);
        }}
        onTouchStart={e => {
          if (e.touches[0]) {
            setIsDragging(true);
            handleMove.current(e.touches[0].clientX);
          }
        }}
        role="slider"
        aria-valuenow={Math.round(pos)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Drag to compare before and after exterior transformation"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'ArrowLeft') setPos(p => Math.max(0, p - 5));
          if (e.key === 'ArrowRight') setPos(p => Math.min(100, p + 5));
        }}
      >
        <img
          className="comparison-image"
          src={current.after}
          alt={current.afterAlt || 'After exterior transformation'}
          loading="lazy"
          decoding="async"
        />
        <div
          className="comparison-overlay"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <img
            className="comparison-image"
            src={current.before}
            alt={current.beforeAlt || 'Before exterior transformation'}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="comparison-divider" style={{ left: `${pos}%` }}>
          <div className="comparison-handle" aria-hidden="true">
            <ChevronLeft size={14} strokeWidth={2.5} />
            <ChevronRight size={14} strokeWidth={2.5} />
          </div>
        </div>
        <span className="comparison-badge badge-before">BEFORE</span>
        <span className="comparison-badge badge-after">AFTER</span>
        <div className="drag-hint">DRAG TO COMPARE</div>
      </div>
      <div className="before-after-actions">
        <a className="btn outline" href="/projects">
          <span>See More Projects</span>
          <ArrowUpRight aria-hidden="true" />
        </a>
        <ButtonLink href="/request-a-quote">Start Your Project</ButtonLink>
      </div>
    </div>
  );
}

function BeforeAfter({
  before,
  after,
  beforeAlt,
  afterAlt,
}: {
  before: string;
  after: string;
  beforeAlt?: string;
  afterAlt?: string;
}) {
  return (
    <InteractiveBeforeAfter
      before={before}
      after={after}
      beforeAlt={beforeAlt}
      afterAlt={afterAlt}
    />
  );
}

export function ContentPage({
  path,
  content,
  record,
}: {
  path: string;
  content: Content;
  record?: RecordData;
}) {
  const service = content.services.find(s => path === 'services/' + s.id);
  let title = '',
    label = '',
    description = '';
  if (service) {
    title = service.title;
    label = 'Our expertise';
    description = service.summary;
  } else {
    const data: Record<string, string[]> = {
      about: [
        'Built on experience. Focused on quality.',
        'About Sardaar G',
        'Dependable exterior cladding installation. Long-term relationships. Pride in the details.',
      ],
      services: [
        'Exterior systems. Installed with precision.',
        'Our expertise',
        'A coordinated exterior, from the weather barrier to the final trim.',
      ],
      projects: [
        'Our work. In detail.',
        'Project portfolio',
        'Explore the scope, materials and workmanship behind our exterior projects.',
      ],
      industries: [
        'Built for your sector.',
        'Industries we serve',
        'From custom homes to multi-family developments, the right approach starts with understanding your project.',
      ],
      'our-process': [
        'Clear process. Reliable execution.',
        'How we work',
        'Five considered steps, from your initial plans to the finishing details.',
      ],
      'service-areas': [
        'Across British Columbia.',
        'Our reach',
        'Exterior cladding installation with a focus on the needs of your location and project.',
      ],
      warranty: [
        'Built With Precision. Protected With Confidence.',
        'Quality Assurance & Warranty Coverage',
        'Every Sardaar G Construction project is completed with a strong focus on workmanship, proper installation, weather protection, and manufacturer requirements. We coordinate manufacturer warranties and stand behind the quality of the exterior work we deliver.',
      ],
      contact: [
        'Let’s build a conversation.',
        'Get in touch',
        'Tell us a little about your plans. Have drawings ready? Use our complete quote form.',
      ],
      'request-a-quote': [
        'Your next project starts here.',
        'Request a quote',
        'Share your project details, drawings and scope of work.',
      ],
      privacy: [
        'Your information. Handled with care.',
        'Privacy',
        'How this website handles project enquiries and uploaded documents.',
      ],
      insights: [
        'Notes from the exterior.',
        'Insights',
        'Practical perspectives on materials, planning and exterior workmanship.',
      ],
    };
    [title, label, description] = data[path] || [
      record?.title || 'Project',
      'A closer look',
      record?.data.summary || '',
    ];
  }

  const phoneDisplay = formatPhoneDisplay(content.settings.phone);
  const phoneHref = formatPhoneHref(content.settings.phone);
  const emailHref = formatEmailHref('info@sardaarg.ca');
  const instagramUrl =
    content.settings.instagram &&
    content.settings.instagram.startsWith('https://')
      ? content.settings.instagram
      : 'https://www.instagram.com/sardaarg_ltd/';

  return (
    <Frame
      content={content}
      closing={!['contact', 'request-a-quote', 'privacy'].includes(path)}
    >
      <InnerHero title={title} label={label} description={description} />
      <section
        className={'section shell page-content page-' + path.split('/')[0]}
      >
        {path === 'about' && (
          <div className="intro">
            <div>
              <div className="label">The way we work</div>
              <h2>
                Workmanship.
                <br />
                Reliability.
                <br />
                Every time.
              </h2>
              <p>
                Sardaar G Construction Ltd. was established with a focus on
                providing dependable exterior cladding installation and building
                long-term relationships with contractors, builders and clients.
                Our experience comes from hands-on work in the siding and
                exterior cladding industry.
              </p>
              <p>
                We bring planning, coordination and attention to detail to every
                job. Our priorities are clear: professional crews, safe working
                practices, communication, schedule and budget awareness, and
                quality workmanship.
              </p>
              <p>We take pride in getting the job done right the first time.</p>
            </div>
            <Photo name="timber-home" />
          </div>
        )}

        {path === 'services' && <ServiceList content={content} />}

        {service && (
          <div className="intro">
            <div>
              <h2>{service.summary}</h2>
              <p>{service.body}</p>
              <h3 style={{ marginTop: 35, fontSize: 25 }}>
                Materials &amp; scope
              </h3>
              <ul
                style={{
                  lineHeight: 2.2,
                  paddingLeft: 20,
                  marginTop: 20,
                }}
              >
                {(service.bulletPoints || service.materials.split(', ')).map(
                  m => (
                    <li key={m}>{m}</li>
                  ),
                )}
              </ul>
              <div style={{ marginTop: 30 }}>
                <ButtonLink
                  href={
                    '/request-a-quote?service=' +
                    encodeURIComponent(service.title)
                  }
                />
              </div>
            </div>
            <Photo name={service.image} alt={service.imageAlt} />
          </div>
        )}

        {path === 'projects' && <Portfolio content={content} />}

        {path === 'industries' && (
          <>
            <IndustriesShowcase />
            <div className="intro" style={{ marginTop: 70 }}>
              <Photo name="interlude-detail-facade" />
              <div>
                <div className="label">Integrated Envelope Delivery</div>
                <h2>A partner for the whole exterior.</h2>
                <p>
                  Builders and general contractors need a team that understands
                  sequencing, specification and site coordination. We approach
                  the exterior as one connected scope, with care at every
                  transition.
                </p>
                <div style={{ marginTop: 24 }}>
                  <ButtonLink href="/request-a-quote">
                    Send Drawings for Estimate
                  </ButtonLink>
                </div>
              </div>
            </div>
          </>
        )}

        {path === 'our-process' && (
          <div className="process-expanded">
            {steps.map(([t, s, b], i) => (
              <div
                className="intro"
                style={{
                  padding: '40px 0',
                  borderBottom: '1px solid #ccc7bd',
                }}
                key={t}
              >
                <div>
                  <div className="label">0{i + 1} / The process</div>
                  <h2>{t}</h2>
                </div>
                <div>
                  <p>{s}</p>
                  <p>{b}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {path === 'service-areas' && (
          <div className="coverage">
            <div>
              <h2>
                Regional knowledge.
                <br />
                Project-led reach.
              </h2>
              <p style={{ marginTop: 25 }}>
                We work throughout British Columbia and are available to travel
                for larger projects. Share your location, scale and schedule so
                we can discuss availability.
              </p>
            </div>
            <div>
              {areas.map(a => (
                <div className="service-row" key={a}>
                  <h3>{a}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {path === 'warranty' && (
          <div className="warranty-page-content">
            <div className="warranty-hero-badge">
              <Shield size={14} aria-hidden="true" /> Certified Installation
              &amp; Coverage Assurance
            </div>
            <div className="warranty-pillars">
              <article className="warranty-card">
                <div className="warranty-card-top">
                  <div className="warranty-icon-wrap">
                    <Wrench size={18} aria-hidden="true" />
                  </div>
                  <h3>Workmanship &amp; Installation Assurance</h3>
                </div>
                <p>
                  Sardaar G Construction Ltd. stands behind every exterior
                  project we deliver. Our crews install exterior cladding,
                  siding, rainscreen assemblies, and architectural trims in
                  accordance with the British Columbia Building Code and
                  manufacturer guidelines.
                </p>
                <div className="warranty-tags">
                  <span className="warranty-tag">BC Building Code Compliant</span>
                  <span className="warranty-tag">Precise Fasteners</span>
                  <span className="warranty-tag">Flashing Integration</span>
                </div>
              </article>

              <article className="warranty-card">
                <div className="warranty-card-top">
                  <div className="warranty-icon-wrap">
                    <ShieldCheck size={18} aria-hidden="true" />
                  </div>
                  <h3>Manufacturer Material Warranties</h3>
                </div>
                <p>
                  Exterior products and systems installed by Sardaar G are
                  covered by their respective manufacturer product warranties,
                  including James Hardie, Allura, Vicwest, Longboard, Nichiha,
                  and Tyvek, subject to manufacturer specifications.
                </p>
                <div className="warranty-tags">
                  <span className="warranty-tag">James Hardie</span>
                  <span className="warranty-tag">Allura</span>
                  <span className="warranty-tag">Vicwest</span>
                  <span className="warranty-tag">Longboard</span>
                  <span className="warranty-tag">Nichiha</span>
                  <span className="warranty-tag">Tyvek</span>
                </div>
              </article>

              <article className="warranty-card">
                <div className="warranty-card-top">
                  <div className="warranty-icon-wrap">
                    <Umbrella size={18} aria-hidden="true" />
                  </div>
                  <h3>Weather Protection &amp; Moisture Management</h3>
                </div>
                <p>
                  Long-term exterior performance starts beneath the surface.
                  Assemblies incorporate building paper, Tyvek, SuperGuard,
                  VP100 membranes, continuous flashings, and engineered
                  strapping systems for Canadian weather.
                </p>
                <div className="warranty-tags">
                  <span className="warranty-tag">Tyvek / SuperGuard</span>
                  <span className="warranty-tag">VP100 Membranes</span>
                  <span className="warranty-tag">Engineered Strapping</span>
                  <span className="warranty-tag">Continuous Flashings</span>
                </div>
              </article>

              <article className="warranty-card">
                <div className="warranty-card-top">
                  <div className="warranty-icon-wrap">
                    <ClipboardCheck size={18} aria-hidden="true" />
                  </div>
                  <h3>Quality Control From Installation to Completion</h3>
                </div>
                <p>
                  Every completed project undergoes a comprehensive walkthrough
                  with the project team. Any outstanding items are addressed
                  through the agreed close-out process before final handover.
                </p>
                <div className="warranty-tags">
                  <span className="warranty-tag">Site Walkthrough</span>
                  <span className="warranty-tag">Deficiency Close-Out</span>
                  <span className="warranty-tag">Final Handover Assurance</span>
                </div>
              </article>
            </div>

            <InteractiveBeforeAfter
              pairs={content.projects
                .filter(p => p.data.before && p.data.after)
                .map(p => ({
                  title: p.title,
                  before: p.data.before,
                  after: p.data.after,
                  beforeAlt: p.data.beforeAlt || p.title + ' before',
                  afterAlt: p.data.afterAlt || p.title + ' after',
                }))}
            />

            <div className="warranty-support-wrap">
              <div className="warranty-support-info">
                <div className="label">Warranty Support &amp; Contact</div>
                <h2>Warranty Inquiries &amp; Support</h2>
                <p>
                  Need warranty documentation or assistance with a
                  project-specific warranty inquiry? Our team is available to
                  help.
                </p>
                <div className="warranty-contacts-list">
                  <div className="warranty-contact-item">
                    <span>Email Assistance</span>
                    <a href={emailHref}>info@sardaarg.ca</a>
                  </div>
                  <div className="warranty-contact-item">
                    <span>Direct Phone</span>
                    <a href={phoneHref}>{phoneDisplay}</a>
                  </div>
                </div>
              </div>
              <div className="warranty-support-actions">
                <h3>Direct Project Support</h3>
                <p>
                  Reach out to discuss warranty documentation, project close-out
                  packages, or schedule a site inspection.
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    marginTop: 6,
                  }}
                >
                  <ButtonLink href="/contact" className="dark">
                    Contact Our Team
                  </ButtonLink>
                  <a className="btn outline" href="/request-a-quote">
                    <span>Request Warranty Support</span>
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>

            <div className="warranty-disclaimer">
              <strong>Warranty Coverage Disclaimer:</strong> Warranty coverage
              is subject to manufacturer terms, project specifications,
              installation requirements, exclusions, and conditions. For
              project-specific warranty documentation, please contact Sardaar G
              Construction Ltd.
            </div>
          </div>
        )}

        {(path === 'contact' || path === 'request-a-quote') && (
          <div className="quote-layout">
            <aside className="quote-aside">
              <div className="quote-aside-head">
                <div className="label">Let’s work together</div>
                <h2>
                  Bring us
                  <br />
                  <em>your vision.</em>
                </h2>
                <p>
                  Multi-family, commercial, new construction or residential — we’d
                  like to hear what you’re planning.
                </p>
              </div>

              <div className="contact-cards-grid">
                <a className="contact-info-card" href={phoneHref}>
                  <span className="contact-card-icon" aria-hidden="true">
                    <Phone size={18} strokeWidth={1.6} />
                  </span>
                  <div className="contact-card-body">
                    <span className="contact-card-label">Direct Phone</span>
                    <strong>{phoneDisplay}</strong>
                    <small>Click to call our BC team</small>
                  </div>
                  <ArrowUpRight className="contact-card-arrow" size={16} aria-hidden="true" />
                </a>

                <a className="contact-info-card" href={emailHref}>
                  <span className="contact-card-icon" aria-hidden="true">
                    <Mail size={18} strokeWidth={1.6} />
                  </span>
                  <div className="contact-card-body">
                    <span className="contact-card-label">Email Enquiries</span>
                    <strong>info@sardaarg.ca</strong>
                    <small>Send plans, specs, or questions</small>
                  </div>
                  <ArrowUpRight className="contact-card-arrow" size={16} aria-hidden="true" />
                </a>

                <div className="contact-info-card is-static">
                  <span className="contact-card-icon" aria-hidden="true">
                    <MapPin size={18} strokeWidth={1.6} />
                  </span>
                  <div className="contact-card-body">
                    <span className="contact-card-label">Service Coverage</span>
                    <strong>
                      {content.settings.service_area || 'British Columbia, Canada'}
                    </strong>
                    <small>
                      {content.settings.address ||
                        'Lower Mainland, Fraser Valley, Metro Vancouver, Island & Interior BC'}
                    </small>
                  </div>
                </div>

                <a
                  className="contact-info-card"
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="contact-card-icon" aria-hidden="true">
                    <ShieldCheck size={18} strokeWidth={1.6} />
                  </span>
                  <div className="contact-card-body">
                    <span className="contact-card-label">Recent Field Work</span>
                    <strong>Instagram · @sardaarg_ltd</strong>
                    <small>View active BC exterior installations</small>
                  </div>
                  <ArrowUpRight className="contact-card-arrow" size={16} aria-hidden="true" />
                </a>
              </div>

              {content.settings.maps_embed_url && (
                <iframe
                  title="Our location"
                  src={content.settings.maps_embed_url}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="contact-map-iframe"
                />
              )}

              {path === 'contact' && (
                <div className="quote-aside-switch">
                  <p>Have architectural drawings or a take-off package ready?</p>
                  <TextLink href="/request-a-quote">
                    Send drawings &amp; request a quote
                  </TextLink>
                </div>
              )}
            </aside>
            <QuoteForm compact={path === 'contact'} />
          </div>
        )}

        {path === 'privacy' && (
          <div className="content-prose">
            <h2>Project enquiries</h2>
            <p>
              We collect the contact details, company information, project
              details and documents you choose to send. We use this information
              to assess your project and communicate with you about your
              enquiry. Submitting an enquiry does not subscribe you to
              marketing.
            </p>
            <h2>Storage and access</h2>
            <p>
              Enquiries are stored in the website’s database. Attachments are
              stored privately and are accessible only through authorised owner
              access. The hosting and storage providers process this information
              to operate the website. Do not upload unnecessary personal
              information, passwords or financial records.
            </p>
            <h2>Cookies and sign-in</h2>
            <p>
              Owner access uses Supabase sign-in and its required authentication
              cookies. This site does not add advertising trackers. Basic
              request information may be processed for security and spam
              prevention.
            </p>
            <h2>Your choices</h2>
            <p>
              To request access, correction or deletion of an enquiry, use the
              contact form and identify your original enquiry. Do not send
              additional sensitive documents for verification unless requested.
            </p>
          </div>
        )}

        {path === 'insights' && (
          <div className="industry-grid">
            {content.articles.map(a => (
              <article key={a.id}>
                <h3>{a.title}</h3>
                <p>{a.data.summary}</p>
                <TextLink href={'/insights/' + a.slug}>Read article</TextLink>
              </article>
            ))}
          </div>
        )}

        {record?.kind === 'article' && (
          <article className="content-prose">
            {record.data.cover && (
              <img
                src={record.data.cover}
                alt={record.data.coverAlt || record.title}
                loading="lazy"
                decoding="async"
              />
            )}
            {record.data.body
              ?.split('\n')
              .map((p: string, i: number) => <p key={i}>{p}</p>)}
          </article>
        )}

        {record?.kind === 'project' && (
          <div className="project-case-detail">
            <div className="project-meta">
              {[
                ['Location', record.data.location],
                ['Sector', record.data.type],
                ['Primary Cladding', record.data.materials],
                ['Rainscreen & WRB', record.data.rainscreen],
                ['Status', record.data.status],
                ['Completion', record.data.year],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <div className="label">{k}</div>
                    <p>{v}</p>
                  </div>
                ))}
            </div>
            {record.data.cover && (
              <div className="project-detail-hero-frame">
                <img
                  src={record.data.cover}
                  alt={record.data.coverAlt || record.title}
                  loading="lazy"
                  decoding="async"
                  style={{
                    maxHeight: 680,
                    width: '100%',
                    objectFit: 'cover',
                    objectPosition: record.data.focal || '50% 50%',
                  }}
                />
              </div>
            )}
            <div className="project-detail-scope-grid">
              <div className="project-detail-prose">
                <div className="label">01 / Execution Overview</div>
                <h2>Scope of work</h2>
                <p>{record.data.scope}</p>
                {record.data.trimSystem && (
                  <p>
                    <strong>Architectural Trim &amp; Soffit Package:</strong>{' '}
                    {record.data.trimSystem}
                  </p>
                )}
              </div>
              {Array.isArray(record.data.deliverables) &&
                record.data.deliverables.length > 0 && (
                  <div className="project-detail-deliverables">
                    <div className="label">02 / Key Deliverables</div>
                    <h3>Completed Envelope Package</h3>
                    <ul>
                      {record.data.deliverables.map((d: string) => (
                        <li key={d}>
                          <CheckCheck size={16} aria-hidden="true" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
            {record.data.media?.length > 0 && (
              <div style={{ marginTop: 48 }}>
                <div className="label" style={{ marginBottom: 14 }}>
                  03 / Project Photography
                </div>
                <Gallery media={record.data.media} />
              </div>
            )}
            {record.data.before && record.data.after && (
              <BeforeAfter
                before={record.data.before}
                after={record.data.after}
                beforeAlt={record.data.beforeAlt}
                afterAlt={record.data.afterAlt}
              />
            )}
            {record.data.video && (
              <video
                controls
                preload="none"
                poster={record.data.poster}
                src={record.data.video}
                style={{ width: '100%', marginTop: 30 }}
              />
            )}
            <div className="project-detail-actions">
              <ButtonLink
                href={
                  '/request-a-quote?project=' +
                  encodeURIComponent(record.title)
                }
              >
                Discuss a similar project
              </ButtonLink>
              <a className="btn outline dark" href="/projects">
                <span>Back to All Projects</span>
                <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          </div>
        )}
      </section>
    </Frame>
  );
}
