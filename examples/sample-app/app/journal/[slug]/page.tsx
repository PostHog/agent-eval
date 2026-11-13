import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findJournalEntry, journalEntries } from "@/lib/journal";
import styles from "./article.module.css";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return journalEntries.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const entry = findJournalEntry((await params).slug);

  return entry
    ? { title: entry.title, description: entry.summary }
    : { title: "Field note not found" };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const entry = findJournalEntry((await params).slug);

  if (!entry) notFound();

  return (
    <article className={styles.article}>
      <header>
        <Link className="text-link" href="/journal">
          All field notes
        </Link>
        <p className="supporting-text">{entry.readTime}</p>
        <h1>{entry.title}</h1>
        <p>{entry.summary}</p>
      </header>

      <div className={styles.image}>
        <Image src={entry.image} alt="" fill priority sizes="100vw" />
      </div>

      <div className={styles.body}>
        {entry.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>

      <footer>
        <h2>Ready to pack?</h2>
        <Link className="primary-button" href="/shop">
          Browse gear
        </Link>
      </footer>
    </article>
  );
}
