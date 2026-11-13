import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { formatPrice } from "@/lib/format";
import { products } from "@/lib/products";
import styles from "./home.module.css";

const featured = products.filter((product) => product.featured);
const weekendKit = products.filter((product) =>
  ["ridge-pack-28", "beacon-lantern", "enamel-camp-mug"].includes(product.id),
);

export default function HomePage() {
  const kitTotal = weekendKit.reduce(
    (total, product) => total + product.price,
    0,
  );

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroImage}>
          <Image
            src="https://images.unsplash.com/photo-1625013964767-0e4b3c041607?auto=format&fit=crop&w=1800&q=90"
            alt="A trail pack surrounded by equipment for a weekend outside"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 56vw"
          />
        </div>
        <div className={styles.heroCopy}>
          <h1>Pack less. Stay longer.</h1>
          <p>
            Dependable equipment for quick departures, changing weather, and one
            more night outside.
          </p>
          <div className={styles.heroActions}>
            <Link className="primary-button" href="/shop">
              Shop all gear <ArrowIcon />
            </Link>
            <Link className="secondary-button" href="/journal">
              Read field notes
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.kit}>
        <div className={styles.kitIntro}>
          <h2>A three-piece weekender.</h2>
          <p>
            Start with a balanced pack, reliable light, and a mug that can take
            a knock. Add the rest when the route asks for it.
          </p>
          <p className={styles.kitPrice}>{formatPrice(kitTotal)} complete</p>
        </div>
        <ol className={styles.kitList}>
          {weekendKit.map((product) => (
            <li key={product.id}>
              <Link href={`/shop/${product.slug}`}>
                <span>{product.name}</span>
                <strong>{formatPrice(product.price)}</strong>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.featured}>
        <div className={styles.sectionHeading}>
          <h2>Most packed this month</h2>
          <Link className="text-link" href="/shop">
            See all eight products
          </Link>
        </div>
        <div className={styles.productGrid}>
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className={styles.promise}>
        <div>
          <h2>Use it hard. Repair it. Keep going.</h2>
        </div>
        <dl>
          <div>
            <dt>30 days</dt>
            <dd>Take gear outside before you decide to keep it.</dd>
          </div>
          <div>
            <dt>Useful repairs</dt>
            <dd>Common buckles, seals, and straps are replaceable.</dd>
          </div>
          <div>
            <dt>Plain answers</dt>
            <dd>Each product lists stock, materials, and limits clearly.</dd>
          </div>
        </dl>
      </section>

      <section className={styles.journal}>
        <div className={styles.journalImage}>
          <Image
            src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1600&q=85"
            alt="A small tent pitched beside a lake at dusk"
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
          />
        </div>
        <div className={styles.journalCopy}>
          <h2>The first cold night of fall</h2>
          <p>
            A field checklist for condensation, wet firewood, and the moment
            your summer sleep system stops being enough.
          </p>
          <Link className="text-link" href="/journal">
            Read the field note
          </Link>
        </div>
      </section>
    </>
  );
}
