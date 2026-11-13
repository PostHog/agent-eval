import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell">
      <div className="page-heading">
        <h1>That trail ends here.</h1>
        <div>
          <p>The page moved, or the route never existed.</p>
          <Link className="primary-button" href="/shop">
            Return to the shop
          </Link>
        </div>
      </div>
    </div>
  );
}
