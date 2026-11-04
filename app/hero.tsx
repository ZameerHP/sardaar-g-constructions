'use client';
import { useState } from 'react';
import { ArrowDown, ArrowUpRight, ShieldCheck, Building2, BadgeCheck } from 'lucide-react';

const trustBadges = [
  { Icon: ShieldCheck, title: 'BC Code', subtitle: 'Compliant' },
  { Icon: Building2, title: 'Commercial & Res.', subtitle: 'Full Scope' },
  { Icon: BadgeCheck, title: 'Manufacturer', subtitle: 'Approved Installs' },
];

export function CinematicHero() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="hero-scroll-stage">
      <section
        className={'cinema-hero' + (imageFailed ? ' image-fallback' : '')}
        aria-label="Sardaar G exterior cladding"
      >
        <div className="cinema-scene" aria-hidden="true">
          <div className="cinema-sky" />
          <div className="cinema-brand-depth">
            <div className="cinema-mobile-kicker" aria-hidden="true">
              EXTERIOR SPECIALISTS
            </div>
            <div className="cinema-wordmark">
              {'SARDAAR G'.split('').map((letter, i) => (
                <span
                  key={i}
                  className={letter === ' ' ? 'cinema-wordmark-space' : undefined}
                  style={{ animationDelay: `${0.06 + i * 0.035}s` }}
                >
                  {letter === ' ' ? '\u00a0' : letter}
                </span>
              ))}
            </div>
          </div>
          <div className="cinema-building-depth">
            <div className="cinema-building-enter">
              <img
                src="/images/hero-foreground.webp"
                alt="Sardaar G Construction architectural facade and exterior cladding installation in British Columbia"
                fetchPriority="high"
                loading="eager"
                decoding="async"
                width="1536"
                height="1024"
                sizes="100vw"
                onError={() => setImageFailed(true)}
              />
            </div>
          </div>
          <div className="cinema-shade" />
        </div>

        <div className="cinema-meta shell">
          <span>Exterior Specialists · British Columbia</span>
          <span>Crafted With Precision. Protected With Confidence.</span>
        </div>

        <div className="cinema-content shell">
          <div className="cinema-statement">
            <div className="hero-pill-badge">
              <span className="hero-pill-dot" aria-hidden="true" />
              <span>BRITISH COLUMBIA CLADDING &amp; SIDING CONTRACTOR</span>
            </div>
            <div className="hero-company-line label gold">
              SARDAAR G CONSTRUCTION LTD.
            </div>
            <h1>
              Exterior cladding
              <br />
              <span>solutions.</span>
            </h1>
          </div>

          <div className="cinema-enquiry">
            <p>
              Premium architectural cladding, engineered rainscreen assemblies,
              and siding installation for residential, multi-family, and
              commercial developments across British Columbia.
            </p>
            <div className="cinema-actions">
              <a href="/request-a-quote" className="btn">
                <span>Request a quote</span>
                <ArrowUpRight aria-hidden="true" />
              </a>
              <a href="/projects" className="cinema-projects">
                <span>View our projects</span>
                <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
            <div
              className="hero-feature-highlights"
              role="list"
              aria-label="Key qualifications"
            >
              {trustBadges.map(({ Icon, title, subtitle }) => (
                <div
                  className="hero-highlight-item"
                  role="listitem"
                  key={title}
                >
                  <span className="hero-highlight-icon-wrap" aria-hidden="true">
                    <Icon
                      className="hero-highlight-icon"
                      size={20}
                      strokeWidth={1.5}
                    />
                  </span>
                  <div className="hero-highlight-text">
                    <strong>{title}</strong>
                    <span>{subtitle}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cinema-footer shell">
          <a href="#intro">
            <span className="scroll-track">
              <ArrowDown size={16} aria-hidden="true" />
            </span>
            <span>SCROLL TO DISCOVER</span>
          </a>
        </div>
      </section>
    </div>
  );
}
