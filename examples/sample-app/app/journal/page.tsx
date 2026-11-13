import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { journalEntries } from "@/lib/journal";
import styles from "./journal.module.css";

export const metadata: Metadata = {
  title: "Field notes",
  description: "Practical notes for weekends outside.",
};

export default function JournalPage() {
  return (
    <div className="page-shell">
      <div className="page-heading">
        <h1>Notes worth carrying.</h1>
        <p>
          Short guides for cold nights, worn equipment, and meals that taste
          better after a long walk.
        </p>
      </div>

      <div className={styles.entries}>
        {journalEntries.map((entry, index) => (
          <article
            key={entry.slug}
            className={`${styles.entry} ${index % 2 ? styles.reverse : ""}`}
          >
            <Link className={styles.image} href={`/journal/${entry.slug}`}>
              <Image
                src={entry.image}
                alt=""
                fill
                priority={index === 0}
                sizes="(max-width: 760px) 100vw, 50vw"
              />
            </Link>
            <div>
              <p className="supporting-text">{entry.readTime}</p>
              <h2>
                <Link href={`/journal/${entry.slug}`}>{entry.title}</Link>
              </h2>
              <p>{entry.summary}</p>
              <Link className="text-link" href={`/journal/${entry.slug}`}>
                Read field note
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
