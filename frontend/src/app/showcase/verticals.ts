// Industry showcase demos — each doubles as a portfolio piece, a reel, and a
// "we build this for you" sales page. Colors are inline (not Tailwind classes)
// so per-vertical theming survives the production build.

export type Feature = { icon: string; title: string; desc: string };
export type Stat = { value: string; label: string };

export type Vertical = {
  slug: string;
  name: string;
  emoji: string;
  tagline: string;
  headline: string;
  sub: string;
  colors: { base: string; from: string; to: string; glow: string };
  features: Feature[];
  stats: Stat[];
  ctaLabel: string;
};

export const verticals: Vertical[] = [
  {
    slug: "real-estate",
    name: "Real Estate",
    emoji: "🏙️",
    tagline: "Property & Realty",
    headline: "Find a home worth the story.",
    sub: "Curated listings, immersive tours, and a booking flow that turns browsers into buyers.",
    colors: { base: "#0a1224", from: "#f5d17a", to: "#4a7dff", glow: "#d4af37" },
    features: [
      { icon: "🏡", title: "Smart listings", desc: "Filter by price, area, and amenities with instant results." },
      { icon: "🗺️", title: "Map & neighborhood", desc: "Explore properties on an interactive map with local insights." },
      { icon: "📅", title: "Book a visit", desc: "Schedule site visits and virtual tours in two taps." },
    ],
    stats: [{ value: "1,200+", label: "Listings" }, { value: "48h", label: "Avg. to visit" }, { value: "4.9★", label: "Buyer rating" }],
    ctaLabel: "List your property",
  },
  {
    slug: "restaurant",
    name: "Restaurant",
    emoji: "🍽️",
    tagline: "Food & Hospitality",
    headline: "Order the moment they're hungry.",
    sub: "A mouth-watering menu, live table booking, and one-tap online ordering.",
    colors: { base: "#1a0f0a", from: "#ff8a3d", to: "#ff3d6e", glow: "#ff6b3d" },
    features: [
      { icon: "📖", title: "Live menu", desc: "Beautiful photo menu that updates the moment you do." },
      { icon: "🛵", title: "Online ordering", desc: "Pickup and delivery with instant order confirmation." },
      { icon: "🪑", title: "Table booking", desc: "Reserve a table by date, time, and party size." },
    ],
    stats: [{ value: "20 min", label: "Avg. delivery" }, { value: "4.8★", label: "1.2k reviews" }, { value: "+38%", label: "Repeat orders" }],
    ctaLabel: "Order now",
  },
  {
    slug: "ecommerce",
    name: "D2C Store",
    emoji: "🛍️",
    tagline: "E-commerce & Brands",
    headline: "A store your brand deserves.",
    sub: "Fast product pages, a frictionless cart, and checkout built to convert.",
    colors: { base: "#140a1f", from: "#a855f7", to: "#ec4899", glow: "#c026d3" },
    features: [
      { icon: "🧺", title: "Product grid", desc: "Snappy catalog with search, tags, and quick view." },
      { icon: "⚡", title: "1-tap checkout", desc: "Saved details and UPI/cards for instant purchase." },
      { icon: "🎁", title: "Offers engine", desc: "Coupons, bundles, and launch drops that sell out." },
    ],
    stats: [{ value: "2.1s", label: "Page load" }, { value: "+52%", label: "Conversion" }, { value: "24/7", label: "Storefront" }],
    ctaLabel: "Shop the drop",
  },
  {
    slug: "clinic",
    name: "Clinic",
    emoji: "🩺",
    tagline: "Healthcare & Doctors",
    headline: "Care that starts before the visit.",
    sub: "Doctor profiles, real-time slots, and appointment booking patients trust.",
    colors: { base: "#04141a", from: "#2dd4bf", to: "#38bdf8", glow: "#22d3ee" },
    features: [
      { icon: "👩‍⚕️", title: "Doctor profiles", desc: "Specialties, experience, and patient ratings up front." },
      { icon: "🗓️", title: "Live slots", desc: "Book available appointment times in seconds." },
      { icon: "💬", title: "Reminders", desc: "Automatic SMS/email reminders cut no-shows." },
    ],
    stats: [{ value: "-64%", label: "No-shows" }, { value: "3 min", label: "To book" }, { value: "4.9★", label: "Patient trust" }],
    ctaLabel: "Book appointment",
  },
  {
    slug: "gym",
    name: "Fitness",
    emoji: "💪",
    tagline: "Gym & Studios",
    headline: "Show up. We'll handle the rest.",
    sub: "Class schedules, trainer profiles, and memberships that renew themselves.",
    colors: { base: "#0a0a0a", from: "#bef264", to: "#22c55e", glow: "#84cc16" },
    features: [
      { icon: "🔥", title: "Class booking", desc: "Reserve spots in HIIT, yoga, and strength classes." },
      { icon: "🏋️", title: "Trainer profiles", desc: "Meet the coaches and book personal sessions." },
      { icon: "💳", title: "Memberships", desc: "Plans, auto-renewals, and progress tracking." },
    ],
    stats: [{ value: "+41%", label: "Retention" }, { value: "12", label: "Weekly classes" }, { value: "4.9★", label: "Member score" }],
    ctaLabel: "Start free trial",
  },
  {
    slug: "edtech",
    name: "EdTech",
    emoji: "🎓",
    tagline: "Coaching & Courses",
    headline: "Learning that actually finishes.",
    sub: "Course pages, enrollment, and progress tracking that keeps students coming back.",
    colors: { base: "#0a0a1f", from: "#6366f1", to: "#f59e0b", glow: "#818cf8" },
    features: [
      { icon: "📚", title: "Course catalog", desc: "Rich course pages with syllabus and previews." },
      { icon: "✅", title: "Easy enrollment", desc: "Sign up, pay, and start in a single flow." },
      { icon: "📈", title: "Progress tracking", desc: "Lessons, streaks, and certificates on completion." },
    ],
    stats: [{ value: "+73%", label: "Completion" }, { value: "5k+", label: "Students" }, { value: "4.8★", label: "Course rating" }],
    ctaLabel: "Enroll today",
  },
];

export const getVertical = (slug: string) => verticals.find((v) => v.slug === slug);
