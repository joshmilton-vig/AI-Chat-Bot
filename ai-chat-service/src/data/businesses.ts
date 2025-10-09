export type Day = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type BusinessProfile = {
  key: string;
  name: string;
  timezone: string; // e.g. 'America/Chicago'
  phone: string;
  email: string;
  hours: Partial<Record<Day, { open: string; close: string } | null>>;
  shippingPolicy: string;
  returnPolicy: string;
  faq?: Record<string, string>;
};

export const BUSINESSES: Record<string, BusinessProfile> = {
  vivid: {
    key: "prisma",
    name: "Prisma",
    timezone: "America/Chicago",
    phone: "(225) 751-7297",
    email: "salesbr@poweredbyprisma.com",
    hours: {
      mon: { open: "08:00", close: "17:00" },
      tue: { open: "08:00", close: "17:00" },
      wed: { open: "08:00", close: "17:00" },
      thu: { open: "08:00", close: "17:00" },
      fri: { open: "08:00", close: "17:00" },
      sat: null,
      sun: null,
    },
    shippingPolicy:
      "Most orders ship within 2–3 business days after approval. Expedited options are available at checkout.",
    returnPolicy:
      "Unopened, non-custom items may be returned within 30 days. Customized or personalized items are final sale.",
    faq: {
      "where is my order":
        "To check your order status, share your order number and ZIP code. I’ll look it up for you.",
    },
  },
};
