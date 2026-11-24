// Seeds Bhavani Fashion with sample categories and products.
// Images are Unsplash placeholders until the client's own photos are uploaded to Cloudinary.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;

const PHOTOS = {
  sariPose: img("1727430228383-aa1fb59db8bf"),
  sariFlowers: img("1769275061202-cf3ef67d7279"),
  sariGreen: img("1679006831648-7c9ea12e5807"),
  sariPinkOrange: img("1617627143750-d86bc21e42bb"),
  sariPurpleGold: img("1641699862936-be9f49b1c38d"),
  sariPatterned: img("1769275061721-bb6439d24ebc"),
  sariRedBrown: img("1610030469983-98e550d6193c"),
  sariWhite: img("1729146768775-3662af38016e"),
  sariGreenRed: img("1597983073540-684a10b15ab1"),
  sariRedWhite: img("1619516388835-2b60acc4049e"),
  sariYellowBlue: img("1706943262454-84ee74854346"),
  sariRedGold: img("1610047614301-13c63f00c032"),
  lehengaYellowMaroon: img("1767955694884-d4bf352c23c2"),
  lehengaBridalRed: img("1759906760638-eeffcb471e53"),
  lehengaPink: img("1794893552686-6dcb717f20df"),
  kurtaWhiteFloral: img("1745313452052-0e4e341f326c"),
  kurtaPinkFloral: img("1741847639057-b51a25d42892"),
};

const rupees = (r: number) => r * 100;
const SIZES = ["XS", "S", "M", "L", "XL"];

type Seed = {
  name: string;
  slug: string;
  description: string;
  fabric: string;
  occasion: string;
  price: number;
  compareAtPrice?: number;
  featured?: boolean;
  isNew?: boolean;
  images: string[];
  colors: [name: string, hex: string][];
  sized?: boolean;
};

const CARE_SAREE = "Dry clean only. Store folded in a muslin cloth, away from direct sunlight.";
const CARE_STITCHED = "Gentle hand wash in cold water or dry clean. Iron on reverse at low heat.";

const sarees: Seed[] = [
  {
    name: "Rani Kanjivaram Silk Saree",
    slug: "rani-kanjivaram-silk-saree",
    description:
      "A pure Kanjivaram silk woven in Kanchipuram with a contrast zari border and a richly patterned pallu. Comes with an unstitched blouse piece.",
    fabric: "Silk",
    occasion: "Wedding",
    price: rupees(12450),
    compareAtPrice: rupees(14900),
    featured: true,
    images: [PHOTOS.sariRedGold, PHOTOS.sariRedBrown],
    colors: [["Crimson", "#9E1B32"]],
  },
  {
    name: "Meera Banarasi Organza Saree",
    slug: "meera-banarasi-organza-saree",
    description:
      "Featherlight Banarasi organza with delicate floral buttis and a sheer, luminous drape. An heirloom that feels effortless to wear.",
    fabric: "Organza",
    occasion: "Festive",
    price: rupees(6890),
    featured: true,
    isNew: true,
    images: [PHOTOS.sariPinkOrange, PHOTOS.sariFlowers],
    colors: [["Rose", "#D9738C"], ["Marigold", "#E49B2A"]],
  },
  {
    name: "Ivory Chanderi Tissue Saree",
    slug: "ivory-chanderi-tissue-saree",
    description:
      "Soft Chanderi tissue in a timeless ivory, finished with a slim gold border. Minimal, graceful, and made for daytime ceremonies.",
    fabric: "Chanderi",
    occasion: "Ceremony",
    price: rupees(4250),
    isNew: true,
    images: [PHOTOS.sariWhite, PHOTOS.sariRedWhite],
    colors: [["Ivory", "#F1E9DA"]],
  },
  {
    name: "Vana Handloom Cotton Saree",
    slug: "vana-handloom-cotton-saree",
    description:
      "Breathable handloom cotton in a deep forest green, woven by artisans in Bengal. Everyday elegance with a crisp, easy drape.",
    fabric: "Cotton",
    occasion: "Everyday",
    price: rupees(2190),
    featured: true,
    images: [PHOTOS.sariGreen, PHOTOS.sariGreenRed],
    colors: [["Forest", "#2F5D46"]],
  },
  {
    name: "Jamuni Tussar Silk Saree",
    slug: "jamuni-tussar-silk-saree",
    description:
      "Textured Tussar silk in a royal plum, with antique-gold zari motifs that catch the light beautifully at evening functions.",
    fabric: "Tussar Silk",
    occasion: "Festive",
    price: rupees(7650),
    compareAtPrice: rupees(8500),
    isNew: true,
    images: [PHOTOS.sariPurpleGold, PHOTOS.sariPose],
    colors: [["Plum", "#5B2A4E"]],
  },
  {
    name: "Basant Printed Georgette Saree",
    slug: "basant-printed-georgette-saree",
    description:
      "Fluid georgette with a playful spring print. Lightweight, wrinkle-resistant and ideal for long days of celebration.",
    fabric: "Georgette",
    occasion: "Party",
    price: rupees(2890),
    images: [PHOTOS.sariFlowers, PHOTOS.sariPatterned],
    colors: [["Saffron", "#E07B2E"], ["Teal", "#2D6E73"]],
  },
  {
    name: "Leela Patola Silk Saree",
    slug: "leela-patola-silk-saree",
    description:
      "Double-ikat inspired Patola pattern on soft silk, in an earthy palette of rust and deep brown with a heritage border.",
    fabric: "Silk",
    occasion: "Wedding",
    price: rupees(9890),
    featured: true,
    images: [PHOTOS.sariRedBrown, PHOTOS.sariRedGold],
    colors: [["Rust", "#8C3B22"]],
  },
  {
    name: "Neelambari Linen Saree",
    slug: "neelambari-linen-saree",
    description:
      "Pure linen in sunflower yellow with an indigo border. Cool, structured and quietly striking, made for summer.",
    fabric: "Linen",
    occasion: "Everyday",
    price: rupees(3450),
    isNew: true,
    images: [PHOTOS.sariYellowBlue, PHOTOS.sariPatterned],
    colors: [["Sunflower", "#E3B23C"]],
  },
  {
    name: "Gulmohar Bandhani Saree",
    slug: "gulmohar-bandhani-saree",
    description:
      "Hand-tied Bandhani from Gujarat in vivid red and white dots. A joyful classic for festivals and family gatherings.",
    fabric: "Art Silk",
    occasion: "Festive",
    price: rupees(3190),
    compareAtPrice: rupees(3790),
    images: [PHOTOS.sariRedWhite, PHOTOS.sariGreenRed],
    colors: [["Scarlet", "#B3242B"]],
  },
  {
    name: "Aarohi Crepe Saree",
    slug: "aarohi-crepe-saree",
    description:
      "Matte crepe with an all-over geometric print and a modern, easy fall. Office to evening, without a second thought.",
    fabric: "Crepe",
    occasion: "Work",
    price: rupees(2490),
    images: [PHOTOS.sariPatterned, PHOTOS.sariPose],
    colors: [["Indigo", "#2E3A67"], ["Mustard", "#C99A2E"]],
  },
];

const lehengas: Seed[] = [
  {
    name: "Shehnaai Bridal Lehenga",
    slug: "shehnaai-bridal-lehenga",
    description:
      "Hand-embroidered bridal lehenga in classic red velvet with zardozi and sequin work, paired with a net dupatta and scalloped border.",
    fabric: "Velvet",
    occasion: "Wedding",
    price: rupees(48900),
    featured: true,
    images: [PHOTOS.lehengaBridalRed, PHOTOS.lehengaYellowMaroon],
    colors: [["Bridal Red", "#A11D2B"]],
    sized: true,
  },
  {
    name: "Gulabi Organza Lehenga",
    slug: "gulabi-organza-lehenga",
    description:
      "Blush organza lehenga with tonal threadwork and a soft, voluminous flare. Perfect for engagements and sangeet nights.",
    fabric: "Organza",
    occasion: "Sangeet",
    price: rupees(21500),
    compareAtPrice: rupees(24900),
    isNew: true,
    images: [PHOTOS.lehengaPink, PHOTOS.lehengaBridalRed],
    colors: [["Blush", "#E7A9B4"]],
    sized: true,
  },
  {
    name: "Haldi Mirror-work Lehenga",
    slug: "haldi-mirror-work-lehenga",
    description:
      "Turmeric-yellow lehenga with a maroon dupatta, finished with hand-set mirror work. Bright, light and made for dancing.",
    fabric: "Chanderi Silk",
    occasion: "Haldi",
    price: rupees(16800),
    featured: true,
    images: [PHOTOS.lehengaYellowMaroon, PHOTOS.lehengaPink],
    colors: [["Haldi Yellow", "#E2B13C"]],
    sized: true,
  },
];

const kurtaSets: Seed[] = [
  {
    name: "Chandni Chikankari Kurta Set",
    slug: "chandni-chikankari-kurta-set",
    description:
      "Lucknowi chikankari on soft cotton mul, with straight pants and a sheer dupatta. Hand-embroidered, airy and endlessly wearable.",
    fabric: "Cotton Mul",
    occasion: "Everyday",
    price: rupees(3890),
    isNew: true,
    featured: true,
    images: [PHOTOS.kurtaWhiteFloral, PHOTOS.kurtaPinkFloral],
    colors: [["White", "#F4F1EA"]],
    sized: true,
  },
  {
    name: "Phoolwari Printed Kurta Set",
    slug: "phoolwari-printed-kurta-set",
    description:
      "A cheerful floral kurta in rose pink with matching pants. Breathable, easy-care and finished with delicate lace trims.",
    fabric: "Rayon",
    occasion: "Casual",
    price: rupees(2290),
    compareAtPrice: rupees(2690),
    images: [PHOTOS.kurtaPinkFloral, PHOTOS.kurtaWhiteFloral],
    colors: [["Rose", "#D98C9C"], ["Sage", "#9AAE8C"]],
    sized: true,
  },
];

const CATEGORIES = [
  {
    name: "Sarees",
    slug: "sarees",
    tagline: "Six yards of story",
    description:
      "Handwoven silks, featherlight organzas and everyday cottons, sourced from India's finest weaving clusters.",
    imageUrl: PHOTOS.sariPinkOrange,
    sortOrder: 1,
    products: sarees,
    care: CARE_SAREE,
    skuPrefix: "BFS",
  },
  {
    name: "Lehengas",
    slug: "lehengas",
    tagline: "Made for the moment",
    description:
      "Bridal and festive lehengas with hand embroidery, crafted to be remembered.",
    imageUrl: PHOTOS.lehengaBridalRed,
    sortOrder: 2,
    products: lehengas,
    care: CARE_STITCHED,
    skuPrefix: "BFL",
  },
  {
    name: "Kurta Sets",
    slug: "kurta-sets",
    tagline: "Everyday, elevated",
    description:
      "Easy, breathable kurta sets in chikankari, prints and soft solids for every day of the week.",
    imageUrl: PHOTOS.kurtaWhiteFloral,
    sortOrder: 3,
    products: kurtaSets,
    care: CARE_STITCHED,
    skuPrefix: "BFK",
  },
];

async function main() {
  console.log("Clearing existing catalogue…");
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  let created = 0;
  for (const { products, care, skuPrefix, ...category } of CATEGORIES) {
    const cat = await prisma.category.create({ data: category });

    for (const [i, p] of products.entries()) {
      const code = `${skuPrefix}${String(i + 1).padStart(3, "0")}`;
      const variants = p.colors.flatMap(([color, colorHex], ci) =>
        (p.sized ? SIZES : [null]).map((size) => ({
          sku: `${code}-${ci + 1}${size ? `-${size}` : ""}`,
          color,
          colorHex,
          size,
          stock: 3 + ((i + ci) % 6),
        })),
      );

      await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          fabric: p.fabric,
          occasion: p.occasion,
          care,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          isFeatured: p.featured ?? false,
          isNewArrival: p.isNew ?? false,
          categoryId: cat.id,
          images: {
            create: p.images.map((url, position) => ({
              url,
              position,
              alt: `${p.name}, view ${position + 1}`,
            })),
          },
          variants: { create: variants },
        },
      });
      created++;
    }
  }

  console.log(`Seeded ${CATEGORIES.length} categories and ${created} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
