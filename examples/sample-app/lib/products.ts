export const categories = ["Camp", "Trail", "Kitchen", "Navigation"] as const;

export type Category = (typeof categories)[number];

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  rating: number;
  reviews: number;
  stock: number;
  image: string;
  description: string;
  details: string[];
  featured?: boolean;
};

export const products: Product[] = [
  {
    id: "ridge-pack-28",
    slug: "ridge-pack-28",
    name: "Ridge pack 28L",
    category: "Trail",
    price: 148,
    rating: 4.8,
    reviews: 84,
    stock: 7,
    image:
      "https://images.unsplash.com/photo-1625013964767-0e4b3c041607?auto=format&fit=crop&w=1400&q=85",
    description: "A balanced day pack with room for an unplanned night out.",
    details: [
      "28 liter capacity",
      "Recycled ripstop shell",
      "Removable hip belt",
    ],
    featured: true,
  },
  {
    id: "beacon-lantern",
    slug: "beacon-lantern",
    name: "Beacon lantern",
    category: "Camp",
    price: 64,
    rating: 4.7,
    reviews: 52,
    stock: 14,
    image:
      "https://images.unsplash.com/photo-1571800618799-1b569be70930?auto=format&fit=crop&w=1400&q=85",
    description:
      "Warm, dimmable light with a battery that lasts through the weekend.",
    details: [
      "80 hour low setting",
      "USB-C rechargeable",
      "Weather-resistant steel body",
    ],
    featured: true,
  },
  {
    id: "enamel-camp-mug",
    slug: "enamel-camp-mug",
    name: "Enamel camp mug",
    category: "Kitchen",
    price: 24,
    rating: 4.9,
    reviews: 126,
    stock: 32,
    image:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1400&q=85",
    description: "A sturdy 12-ounce mug for coffee, soup, or trail mix.",
    details: ["12 ounce capacity", "Kiln-fired enamel", "Dishwasher safe"],
    featured: true,
  },
  {
    id: "alpine-bottle",
    slug: "alpine-bottle",
    name: "Alpine bottle",
    category: "Trail",
    price: 38,
    rating: 4.6,
    reviews: 61,
    stock: 18,
    image:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1400&q=85",
    description:
      "A leakproof steel bottle sized for side pockets and cup holders.",
    details: [
      "750 milliliter capacity",
      "Double-wall steel",
      "Replaceable silicone seal",
    ],
  },
  {
    id: "cloud-quilt",
    slug: "cloud-quilt",
    name: "Cloud camp quilt",
    category: "Camp",
    price: 186,
    rating: 4.8,
    reviews: 39,
    stock: 5,
    image:
      "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=1400&q=85",
    description:
      "A packable three-season quilt for tents, cabins, and cold couches.",
    details: [
      "20°F comfort rating",
      "Recycled synthetic fill",
      "Packs to 9 by 14 inches",
    ],
  },
  {
    id: "switchback-boots",
    slug: "switchback-boots",
    name: "Switchback boots",
    category: "Trail",
    price: 172,
    rating: 4.5,
    reviews: 73,
    stock: 9,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=85",
    description: "Supportive boots for wet approaches and long descents.",
    details: [
      "Full-grain leather",
      "Resoleable rubber outsole",
      "Wide toe box",
    ],
  },
  {
    id: "trail-atlas",
    slug: "trail-atlas",
    name: "Trail atlas",
    category: "Navigation",
    price: 32,
    rating: 4.7,
    reviews: 46,
    stock: 21,
    image:
      "https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&w=1400&q=85",
    description:
      "Weatherproof regional maps with space for your own route notes.",
    details: [
      "42 regional routes",
      "Water-resistant paper",
      "Scale and elevation keys",
    ],
  },
  {
    id: "switchyard-chair",
    slug: "switchyard-chair",
    name: "Switchyard chair",
    category: "Camp",
    price: 96,
    rating: 4.4,
    reviews: 31,
    stock: 11,
    image:
      "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1400&q=85",
    description:
      "A low camp chair that packs flat and keeps you close to the fire.",
    details: [
      "300 pound capacity",
      "Powder-coated aluminum",
      "Carry sleeve included",
    ],
  },
];

export function findProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}
