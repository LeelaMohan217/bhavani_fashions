// Placeholder copy for the footer information pages. Replace with the store's final text.
export const INFO_PAGES = {
  shipping: {
    title: "Shipping policy",
    eyebrow: "Help",
    intro: "How and when your order reaches you.",
  },
  returns: {
    title: "Returns & exchanges",
    eyebrow: "Help",
    intro: "What to do if a piece isn't quite right.",
  },
  contact: {
    title: "Contact us",
    eyebrow: "Help",
    intro: "Questions about an order, a piece or a size? We're here to help.",
  },
  "our-story": {
    title: "Our story",
    eyebrow: "Kosha",
    intro: "Who we are and the weavers we work with.",
  },
  privacy: {
    title: "Privacy policy",
    eyebrow: "Legal",
    intro: "How we collect, use and protect your information.",
  },
  terms: {
    title: "Terms & conditions",
    eyebrow: "Legal",
    intro: "The terms that apply when you shop with Kosha.",
  },
} as const;

export type InfoPageKey = keyof typeof INFO_PAGES;
