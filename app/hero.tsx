'use client';
import { useState } from 'react';
import { ArrowDown,ArrowUpRight } from 'lucide-react';

export function CinematicHero(){
  const [imageFailed,setImageFailed]=useState(false);
  return <div className="hero-scroll-stage"><section className={'cinema-hero'+(imageFailed?' image-fallback':'')} aria-label="Sardaar G exterior cladding">
    <div className="cinema-scene" aria-hidden="true">
      <div className="cinema-sky"/>
      <div className="cinema-brand-depth"><div className="cinema-wordmark">{'SARDAAR G'.split('').map((letter,i)=><span key={i} style={{animationDelay:`${.08+i*.025}s`}}>{letter===' '?'\u00a0':letter}</span>)}</div></div>
      <div className="cinema-building-depth"><div className="cinema-building-enter"><img src="/images/hero-foreground.webp" alt="" fetchPriority="high" width="1536" height="1024" onError={()=>setImageFailed(true)}/></div></div>
      <div className="cinema-shade"/>
    </div>
    <div className="cinema-meta shell"><span>Exterior specialists / British Columbia</span><span>Crafted with precision. Built with pride.</span></div>
    <div className="cinema-content shell">
      <div className="cinema-statement"><div className="label gold">SARDAAR G CONSTRUCTION LTD.</div><h1>Exterior cladding<br/><span>solutions.</span></h1></div>
      <div className="cinema-enquiry"><p>Professional cladding & siding installation for multi-family, commercial and residential projects across British Columbia.</p><div className="cinema-actions"><a href="/request-a-quote" className="btn">Request a quote<ArrowUpRight aria-hidden="true"/></a><a href="/projects" className="cinema-projects">View our projects<ArrowUpRight aria-hidden="true"/></a></div></div>
    </div>
    <div className="cinema-footer shell"><a href="#intro"><span className="scroll-track"><ArrowDown size={16}/></span><span>SCROLL TO DISCOVER</span></a><span>ARCHITECTURAL CONCEPT · NOT COMPLETED COMPANY WORK</span></div>
  </section></div>
}
