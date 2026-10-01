/** Sample data used by the seed script and the artwork generator. */

export const CATEGORIES = [
  { slug: "plumber", name: "Plumbers", icon: "droplets", description: "Leaks, pipes, taps, water heaters and bathroom fittings." },
  { slug: "electrician", name: "Electricians", icon: "zap", description: "Wiring, sockets, inverters, lighting and fault finding." },
  { slug: "tailor", name: "Tailors", icon: "scissors", description: "Custom outfits, native wear, alterations and repairs." },
  { slug: "mechanic", name: "Mechanics", icon: "car", description: "Servicing, diagnostics, brakes, engines and AC." },
  { slug: "carpenter", name: "Carpenters", icon: "hammer", description: "Furniture, doors, wardrobes, roofing and fittings." },
  { slug: "painter", name: "Painters", icon: "paint-roller", description: "Interior, exterior, POP finishes and wallpaper." },
] as const;

export const AREAS = [
  { slug: "yaba", name: "Yaba", city: "Lagos" },
  { slug: "ikeja", name: "Ikeja", city: "Lagos" },
  { slug: "lekki", name: "Lekki", city: "Lagos" },
  { slug: "surulere", name: "Surulere", city: "Lagos" },
  { slug: "victoria-island", name: "Victoria Island", city: "Lagos" },
  { slug: "ajah", name: "Ajah", city: "Lagos" },
  { slug: "gbagada", name: "Gbagada", city: "Lagos" },
  { slug: "festac", name: "Festac", city: "Lagos" },
] as const;

export const CATEGORY_ART: Record<string, { from: string; to: string; icons: string[] }> = {
  plumber: { from: "#276EF1", to: "#1E54B7", icons: ["droplets", "wrench", "shower-head", "bath", "waves"] },
  electrician: { from: "#FFC043", to: "#C78B00", icons: ["zap", "plug", "lightbulb", "cable", "battery-charging"] },
  tailor: { from: "#7356BF", to: "#4B3780", icons: ["scissors", "shirt", "ruler", "spool", "palette"] },
  mechanic: { from: "#E11900", to: "#9E1200", icons: ["car", "wrench", "cog", "gauge", "fuel"] },
  carpenter: { from: "#99644C", to: "#5E3B2C", icons: ["hammer", "axe", "drill", "armchair", "door-open"] },
  painter: { from: "#05A357", to: "#03703C", icons: ["paint-roller", "paintbrush", "paint-bucket", "palette", "house"] },
};

export const PHOTO_CAPTIONS: Record<string, string[]> = {
  plumber: ["Kitchen sink re-pipe", "Shower mixer install", "Bathtub fitting", "Burst pipe repair", "Water heater service", "Overhead tank plumbing"],
  electrician: ["3-bedroom rewiring", "Inverter + solar setup", "Chandelier install", "Distribution board upgrade", "Outdoor flood lights", "Smart switch install"],
  tailor: ["Agbada for a wedding", "Corporate suit", "Ankara gown", "Aso-ebi set (12 pcs)", "Senator wear", "Dress alteration"],
  mechanic: ["Full engine service", "Brake pad replacement", "AC re-gas", "Computer diagnostics", "Suspension repair", "Gearbox overhaul"],
  carpenter: ["Built-in wardrobe", "Kitchen cabinets", "Solid wood dining set", "Panel door install", "TV console", "Roof truss work"],
  painter: ["Living room repaint", "Exterior fence", "Feature wall", "Office painting", "POP ceiling finish", "Wallpaper install"],
};

type SampleProvider = {
  name: string;
  email: string;
  avatar: string;
  business: string;
  category: (typeof CATEGORIES)[number]["slug"];
  area: (typeof AREAS)[number]["slug"];
  years: number;
  price: number;
  rating: number;
  jobs: number;
  status: "pending" | "verified" | "rejected";
  bio: string;
  phone: string;
};

export const SAMPLE_PROVIDERS: SampleProvider[] = [
  { name: "Tunde Bakare", email: "tunde@artisan.ng", avatar: "tunde", business: "Bakare Plumbing Works", category: "plumber", area: "yaba", years: 9, price: 8000, rating: 4.9, jobs: 212, status: "verified", phone: "0803 111 2201", bio: "Fast, tidy plumbing for homes and offices. Leak detection, pipe replacement and bathroom installs with a 30-day workmanship guarantee." },
  { name: "Chidi Okafor", email: "chidi@artisan.ng", avatar: "chidi", business: "FlowRight Plumbing", category: "plumber", area: "lekki", years: 6, price: 10000, rating: 4.7, jobs: 140, status: "verified", phone: "0803 111 2202", bio: "Specialist in water heaters, pumping machines and overhead tanks. Same-day emergency call-outs within Lekki and Ajah." },
  { name: "Kemi Adeyemi", email: "kemi.p@artisan.ng", avatar: "kemi-p", business: "Kemi Pipes & Fittings", category: "plumber", area: "ikeja", years: 4, price: 7000, rating: 4.6, jobs: 88, status: "verified", phone: "0803 111 2203", bio: "Friendly, reliable plumbing. Kitchen and bathroom fittings, blocked drains and borehole connections." },
  { name: "Musa Ibrahim", email: "musa@artisan.ng", avatar: "musa", business: "Musa Plumbing Services", category: "plumber", area: "festac", years: 12, price: 6000, rating: 4.8, jobs: 301, status: "verified", phone: "0803 111 2204", bio: "Twelve years fixing everything water related across Festac and Amuwo. Honest pricing, no hidden charges." },

  { name: "Emeka Nwosu", email: "emeka@artisan.ng", avatar: "emeka", business: "BrightSpark Electricals", category: "electrician", area: "ikeja", years: 10, price: 12000, rating: 4.9, jobs: 256, status: "verified", phone: "0803 222 3301", bio: "Certified electrician. House wiring, inverter and solar installation, fault tracing and smart home upgrades." },
  { name: "Ngozi Eze", email: "ngozi@artisan.ng", avatar: "ngozi", business: "Ngozi Power Solutions", category: "electrician", area: "victoria-island", years: 7, price: 15000, rating: 4.8, jobs: 160, status: "verified", phone: "0803 222 3302", bio: "Commercial and residential electrical work on the Island. Distribution boards, generator changeovers and lighting design." },
  { name: "Sola Ogunleye", email: "sola@artisan.ng", avatar: "sola", business: "Sola Volts", category: "electrician", area: "surulere", years: 5, price: 8000, rating: 4.5, jobs: 97, status: "verified", phone: "0803 222 3303", bio: "Sockets, switches, ceiling fans and prepaid meter installation. Quick response around Surulere and Yaba." },
  { name: "Ifeanyi Obi", email: "ifeanyi@artisan.ng", avatar: "ifeanyi", business: "Obi Electric Hub", category: "electrician", area: "gbagada", years: 3, price: 7000, rating: 0, jobs: 0, status: "pending", phone: "0803 222 3304", bio: "Young, careful electrician. Solar panels, inverter batteries and full rewiring." },

  { name: "Aisha Bello", email: "aisha@artisan.ng", avatar: "aisha", business: "Aisha Couture", category: "tailor", area: "lekki", years: 8, price: 25000, rating: 4.9, jobs: 330, status: "verified", phone: "0803 333 4401", bio: "Bespoke women's wear, bridal and aso-ebi. Perfect fit guaranteed with two free fittings." },
  { name: "Femi Adebayo", email: "femi@artisan.ng", avatar: "femi", business: "Royal Stitches", category: "tailor", area: "surulere", years: 15, price: 20000, rating: 4.8, jobs: 410, status: "verified", phone: "0803 333 4402", bio: "Agbada, senator and kaftan specialist. Fifteen years dressing grooms and celebrants." },
  { name: "Blessing Udoh", email: "blessing@artisan.ng", avatar: "blessing", business: "Threads by Blessing", category: "tailor", area: "yaba", years: 4, price: 8000, rating: 4.6, jobs: 120, status: "verified", phone: "0803 333 4403", bio: "Student friendly prices on alterations, Ankara styles and repairs. Ready in 48 hours." },
  { name: "Grace Etim", email: "grace@artisan.ng", avatar: "grace", business: "Grace Fashion House", category: "tailor", area: "ajah", years: 2, price: 10000, rating: 0, jobs: 0, status: "pending", phone: "0803 333 4404", bio: "Modern African fashion and corporate wear for women." },

  { name: "Yusuf Lawal", email: "yusuf@artisan.ng", avatar: "yusuf", business: "Lawal Auto Clinic", category: "mechanic", area: "ikeja", years: 14, price: 15000, rating: 4.8, jobs: 380, status: "verified", phone: "0803 444 5501", bio: "Toyota and Honda specialist. Computer diagnostics, engine overhaul, brakes and suspension." },
  { name: "Daniel Okon", email: "daniel@artisan.ng", avatar: "daniel", business: "Okon Mobile Mechanic", category: "mechanic", area: "lekki", years: 6, price: 12000, rating: 4.7, jobs: 150, status: "verified", phone: "0803 444 5502", bio: "I come to you. Servicing, battery replacement, AC re-gas and roadside fixes across Lekki." },
  { name: "Peter Johnson", email: "peter@artisan.ng", avatar: "peter", business: "PJ Motors", category: "mechanic", area: "gbagada", years: 9, price: 10000, rating: 4.5, jobs: 200, status: "verified", phone: "0803 444 5503", bio: "Gearbox and engine experts. Genuine parts and a written warranty on every job." },
  { name: "Samuel Ade", email: "samuel@artisan.ng", avatar: "samuel", business: "Sammy Auto Works", category: "mechanic", area: "festac", years: 3, price: 8000, rating: 0, jobs: 0, status: "rejected", phone: "0803 444 5504", bio: "General auto repairs." },

  { name: "Bola Akinwale", email: "bola@artisan.ng", avatar: "bola", business: "Akinwale Woodcraft", category: "carpenter", area: "yaba", years: 11, price: 20000, rating: 4.9, jobs: 175, status: "verified", phone: "0803 555 6601", bio: "Custom furniture, built-in wardrobes and kitchen cabinets from quality hardwood." },
  { name: "Kunle Afolabi", email: "kunle@artisan.ng", avatar: "kunle", business: "Kunle Doors & Roofing", category: "carpenter", area: "ajah", years: 8, price: 15000, rating: 4.6, jobs: 130, status: "verified", phone: "0803 555 6602", bio: "Doors, roofing, ceilings and general carpentry for new builds and renovations." },
  { name: "Chinedu Eze", email: "chinedu@artisan.ng", avatar: "chinedu", business: "CE Interiors", category: "carpenter", area: "victoria-island", years: 5, price: 30000, rating: 4.7, jobs: 64, status: "verified", phone: "0803 555 6603", bio: "Premium office fit-outs, TV consoles and modern furniture design." },

  { name: "Ada Okeke", email: "ada@artisan.ng", avatar: "ada", business: "Ada Paints & Finishes", category: "painter", area: "lekki", years: 7, price: 18000, rating: 4.8, jobs: 145, status: "verified", phone: "0803 666 7701", bio: "Interior and exterior painting, textured finishes and wallpaper. Clean job, on schedule." },
  { name: "Ibrahim Sani", email: "ibrahim@artisan.ng", avatar: "ibrahim", business: "Sani Colour Masters", category: "painter", area: "surulere", years: 10, price: 12000, rating: 4.7, jobs: 220, status: "verified", phone: "0803 666 7702", bio: "Residential repainting, POP ceilings and screeding. Free colour consultation." },
  { name: "Ruth Adeleke", email: "ruth@artisan.ng", avatar: "ruth", business: "Ruth Decor Studio", category: "painter", area: "ikeja", years: 2, price: 9000, rating: 0, jobs: 0, status: "pending", phone: "0803 666 7703", bio: "Feature walls, murals and kids room designs." },
];

export const SAMPLE_CUSTOMERS = [
  { name: "Amaka Obi", email: "customer@artisan.ng", phone: "0809 000 0001" },
  { name: "David Mensah", email: "david@example.com", phone: "0809 000 0002" },
  { name: "Fatima Garba", email: "fatima@example.com", phone: "0809 000 0003" },
];

export const ADMIN = { name: "Artisan Admin", email: "admin@artisan.ng" };

/** Every sample account uses this password. */
export const SAMPLE_PASSWORD = "password123";
