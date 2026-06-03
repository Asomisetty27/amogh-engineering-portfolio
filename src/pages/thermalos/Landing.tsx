// ThermalOS Landing — composed from focused subcomponents under ./landing/.
// Every visual decision (palette, type scale, motion easing) lives in the
// design-token system: CSS vars in index.css, mirrored in landing/tokens.ts.
// No inline `style={{...}}` policy lives on each subcomponent.

import { Nav }              from './landing/Nav';
import { Hero }             from './landing/Hero';
import { Signal }           from './landing/Signal';
import { Bento }            from './landing/Bento';
import { CompetitorTable }  from './landing/CompetitorTable';
import { Pricing }          from './landing/Pricing';
import { Footer }           from './landing/Footer';

export default function ThermalOSLanding() {
  return (
    <main
      className="min-h-screen overflow-x-clip"
      style={{
        background: 'var(--t-surface-0)',
        color: 'var(--t-text)',
        fontFamily: 'var(--t-font-display)',
      }}
    >
      <Nav />
      <Hero />
      <Signal />
      <Bento />
      <CompetitorTable />
      <Pricing />
      <Footer />
    </main>
  );
}
