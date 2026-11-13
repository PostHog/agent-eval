"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-shell">
      <div className="page-heading">
        <h1>We lost the route.</h1>
        <div>
          <p>Try the page again. Your trip kit is still in this browser.</p>
          <button className="primary-button" type="button" onClick={reset}>
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
