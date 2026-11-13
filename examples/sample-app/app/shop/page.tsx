import type { Metadata } from "next";
import { ShopBrowser } from "@/components/shop-browser";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse all Northstar Supply camp and trail equipment.",
};

export default function ShopPage() {
  return (
    <div className="page-shell">
      <div className="page-heading">
        <h1>Gear for the long way around.</h1>
        <p>
          Eight dependable pieces, clear stock levels, and no mystery bundles.
          Filter the catalog to build the trip you have in mind.
        </p>
      </div>
      <ShopBrowser />
    </div>
  );
}
