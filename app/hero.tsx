'use client';
import { useState } from 'react';
import { ArrowDown,ArrowUpRight } from 'lucide-react';

export function CinematicHero(){
  const [imageFailed,setImageFailed]=useState(false);
  return <div className="hero-scroll-stage"><section className={'cinema-hero'+(imageFailed?' image-fallback':'')} aria-label="Sardaar Ji exterior cladding">
    <div className="cinema-scene" aria-hidden="true">
      <div className="cinema-sky"/>
      <div className="cinema-brand-depth"><div className="cinema-wordmark">{'SARDAAR JI'.split('').map((letter,i)=><span key={i} style={{animationDelay:`${.08+i*.025}s`}}>{letter===' '?'\u00a0':letter}</span>)}</div></div>
      <div className="cinema-building-depth"><div className="cinema-building-enter"><img src="/images/hero-foreground.webp" alt="Sardaar Ji architectural facade installation" fetchPriority="high" width="1536" height="1024" onError={()=>setImageFailed(true)}/></div></div>
      <div className="cinema-shade"/>
    </div>
    <div className="cinema-meta shell"><span>Exterior Specialists · British Columbia</span><span>Crafted With Precision. Protected With Confidence.</span></div>
    <div className="cinema-content shell">
      <div className="cinema-statement">
        <div className="hero-pill-badge"><span className="hero-pill-dot"/> BRITISH COLUMBIA CLADDING & SIDING CONTRACTOR</div>
        <div className="label gold">SARDAAR JI CONSTRUCTION LTD.</div>
        <h1>Exterior cladding<br/><span>solutions.</span></h1>
      </div>
      <div className="cinema-enquiry">
        <p>Premium architectural cladding, engineered rainscreen assemblies, and siding installation for residential, multi-family, and commercial developments across British Columbia.</p>
        <div className="cinema-actions">
          <a href="/request-a-quote" className="btn">Request a quote<ArrowUpRight aria-hidden="true"/></a>
          <a href="/projects" className="cinema-projects">View our projects<ArrowUpRight aria-hidden="true"/></a>
        </div>
        <div className="hero-feature-highlights">
          <div className="hero-highlight-item"><strong>BC Code</strong><span>Compliant</span></div>
          <div className="hero-highlight-divider"/>
          <div className="hero-highlight-item"><strong>Commercial & Res.</strong><span>Full Scope</span></div>
          <div className="hero-highlight-divider"/>
          <div className="hero-highlight-item"><strong>Manufacturer</strong><span>Approved Installs</span></div>
        </div>
      </div>
    </div>
    <div className="cinema-footer shell"><a href="#intro"><span className="scroll-track"><ArrowDown size={16}/></span><span>SCROLL TO DISCOVER</span></a></div>
  </section></div>
}
