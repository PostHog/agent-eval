import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/products";
import { AddToCartButton } from "./add-to-cart-button";
import styles from "./product-card.module.css";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className={styles.card}>
      <Link className={styles.imageLink} href={`/shop/${product.slug}`}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
        />
      </Link>
      <div className={styles.body}>
        <p className={styles.category}>{product.category}</p>
        <h3>
          <Link href={`/shop/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className={styles.description}>{product.description}</p>
        <div className={styles.meta}>
          <strong>{formatPrice(product.price)}</strong>
          <span>
            {product.rating} from {product.reviews} reviews
          </span>
        </div>
        <AddToCartButton
          className={styles.button}
          productId={product.id}
          disabled={product.stock === 0}
        />
      </div>
    </article>
  );
}
