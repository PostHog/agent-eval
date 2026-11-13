import Link from "next/link";
import { CartButton } from "./cart-button";

export function Header() {
  return (
    <>
      <p className="announcement">Free ground shipping on trip kits over $75</p>
      <header className="site-header">
        <Link className="brand" href="/">
          Northstar Supply
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/shop">Shop</Link>
          <Link href="/journal">Field notes</Link>
          <Link href="/account">Account</Link>
        </nav>
        <CartButton />
      </header>
    </>
  );
}
