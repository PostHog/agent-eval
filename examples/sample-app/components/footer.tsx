import Link from "next/link";
import { NewsletterForm } from "./newsletter-form";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-intro">
        <h2>Field notes, not inbox clutter.</h2>
        <p>One useful route, repair, or camp recipe each month.</p>
        <NewsletterForm />
      </div>
      <div className="footer-links">
        <div>
          <h3>Explore</h3>
          <Link href="/shop">All gear</Link>
          <Link href="/journal">Field notes</Link>
          <Link href="/account">Your account</Link>
        </div>
        <div>
          <h3>Northstar</h3>
          <p>Equipment for getting outside and staying there a while.</p>
        </div>
      </div>
      <p className="footer-meta">Synthetic storefront for agent evaluation.</p>
    </footer>
  );
}
