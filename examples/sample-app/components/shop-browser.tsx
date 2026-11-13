"use client";

import { useMemo, useState } from "react";
import { categories, products } from "@/lib/products";
import { SearchIcon } from "./icons";
import { ProductCard } from "./product-card";
import styles from "./shop-browser.module.css";

type Sort = "featured" | "price-low" | "price-high" | "rating";

export function ShopBrowser() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<Sort>("featured");

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = products.filter(
      (product) =>
        (category === "All" || product.category === category) &&
        (!normalized ||
          `${product.name} ${product.description}`
            .toLowerCase()
            .includes(normalized)),
    );

    return [...filtered].sort((left, right) => {
      if (sort === "price-low") return left.price - right.price;
      if (sort === "price-high") return right.price - left.price;
      if (sort === "rating") return right.rating - left.rating;

      return Number(Boolean(right.featured)) - Number(Boolean(left.featured));
    });
  }, [category, query, sort]);

  return (
    <>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className="sr-only">Search products</span>
          <SearchIcon />
          <input
            type="search"
            value={query}
            placeholder="Search packs, camp gear, maps..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className={styles.sort}>
          <span>Sort by</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="rating">Customer rating</option>
          </select>
        </label>
      </div>

      <fieldset className={styles.categories}>
        <legend className="sr-only">Product categories</legend>
        {["All", ...categories].map((entry) => (
          <button
            key={entry}
            type="button"
            aria-pressed={entry === category}
            onClick={() => setCategory(entry)}
          >
            {entry}
          </button>
        ))}
      </fieldset>

      <p className={styles.count} aria-live="polite">
        {visibleProducts.length}{" "}
        {visibleProducts.length === 1 ? "item" : "items"}
      </p>

      {visibleProducts.length ? (
        <div className={styles.grid}>
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <h2>No gear matches that search.</h2>
          <p>Clear the search or choose another category.</p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("All");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
