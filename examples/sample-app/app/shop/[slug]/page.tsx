import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductCard } from "@/components/product-card";
import { formatPrice } from "@/lib/format";
import { findProduct, products } from "@/lib/products";
import styles from "./product.module.css";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = findProduct((await params).slug);

  return product
    ? { title: product.name, description: product.description }
    : { title: "Product not found" };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = findProduct((await params).slug);

  if (!product) notFound();

  const related = products
    .filter(
      (entry) => entry.category === product.category && entry.id !== product.id,
    )
    .slice(0, 2);

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/shop">Shop</Link>
        <span aria-hidden="true">/</span>
        <span>{product.category}</span>
      </nav>

      <section className={styles.product}>
        <div className={styles.image}>
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 800px) 100vw, 58vw"
          />
        </div>
        <div className={styles.details}>
          <p className="supporting-text">{product.category}</p>
          <h1>{product.name}</h1>
          <p className={styles.price}>{formatPrice(product.price)}</p>
          <p className={styles.description}>{product.description}</p>
          <p className={styles.rating}>
            Rated {product.rating} from {product.reviews} field reports
          </p>
          <AddToCartButton
            className="primary-button"
            productId={product.id}
            disabled={product.stock === 0}
          />
          <p className={styles.stock}>
            {product.stock <= 7
              ? `Only ${product.stock} left`
              : "Ready to ship"}
          </p>

          <div className={styles.specs}>
            <h2>Built for repeat trips</h2>
            <ul>
              {product.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className={styles.related}>
          <h2>Pack it with</h2>
          <div>
            {related.map((entry) => (
              <ProductCard key={entry.id} product={entry} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
