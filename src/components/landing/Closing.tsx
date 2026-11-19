import { Github } from 'lucide-react';
import { Button, Reveal } from '@/components/ui';
import { GITHUB_URL } from '@/lib/trace';

/** Closing call to action: a centred band between the dashed rails. */
export function Closing() {
  return (
    <section className="frame-section is-tint no-bottom" aria-labelledby="cta-title">
      <div className="frame">
        <Reveal className="cl">
          <h2 id="cta-title" className="h-section">Clear your cookies, then open the <span className="accent">demo</span>.</h2>
          <p className="lede">Pre-release, open source, no customers yet. Run it, try to fool it, tell us where it breaks.</p>
          <div className="cl-cta">
            <Button href="/demo" size="lg" variant="primary">Try the live demo</Button>
            <Button href={GITHUB_URL} size="lg" variant="secondary" icon={<Github size={16} />}>View on GitHub</Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
