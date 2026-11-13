export type JournalEntry = {
  slug: string;
  title: string;
  summary: string;
  image: string;
  readTime: string;
  sections: { heading: string; body: string }[];
};

export const journalEntries: JournalEntry[] = [
  {
    slug: "first-cold-night",
    title: "The first cold night of fall",
    summary:
      "A field checklist for condensation, wet firewood, and a colder sleep system.",
    image:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1600&q=85",
    readTime: "6 minute read",
    sections: [
      {
        heading: "Start dry",
        body: "Change out of damp layers before the temperature drops. Put tomorrow's socks and base layer in a dry bag before you start dinner.",
      },
      {
        heading: "Move the moisture",
        body: "Open the tent vents, keep wet gear away from the sleeping area, and leave a small gap between your quilt and the tent wall.",
      },
      {
        heading: "Know when to turn around",
        body: "A warm drink does not fix soaked insulation. If your dry layer or sleeping system is compromised, take the short route home.",
      },
    ],
  },
  {
    slug: "repair-a-pack-strap",
    title: "Repair a pack strap before it fails",
    summary:
      "Find the early signs of abrasion and make a trail repair that will hold.",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1600&q=85",
    readTime: "4 minute read",
    sections: [
      {
        heading: "Check the anchor",
        body: "Look where webbing meets the pack body. Loose thread, whitening fabric, and a tilted buckle show where the load is moving.",
      },
      {
        heading: "Stabilize the load",
        body: "Move dense items closer to your back and use a spare strap to share the load before you repair the damaged section.",
      },
    ],
  },
  {
    slug: "coffee-without-a-kitchen",
    title: "Good coffee without a camp kitchen",
    summary: "A compact method for a clean cup when every ounce matters.",
    image:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1600&q=85",
    readTime: "3 minute read",
    sections: [
      {
        heading: "Measure at home",
        body: "Pack one dose for each morning and grind it slightly finer than a standard pour-over. A folded paper filter weighs almost nothing.",
      },
      {
        heading: "Leave no grounds",
        body: "Let the filter cool, squeeze out the water, and pack it with your food waste. Coffee grounds do not belong in streams or fire rings.",
      },
    ],
  },
];

export function findJournalEntry(slug: string) {
  return journalEntries.find((entry) => entry.slug === slug);
}
