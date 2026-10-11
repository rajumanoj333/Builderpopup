// Shared domain model for Brewmate.

export type DrinkTemp = "hot" | "iced";

export interface Drink {
  id: string;
  name: string;
  blurb: string;
  tags: string[];
  temp: DrinkTemp;
  priceCents: number;
  // Approximate caffeine so the recommender can reason about time of day.
  caffeineMg: number;
}

export interface CafeTable {
  id: string;
  x: number; // world position in the room
  z: number;
  occupied: boolean;
  // Anonymized shared-interest tags shown as floating motes.
  interests: string[];
}

export interface RoomState {
  // 0..1 how full the room is (drives ambient figures + staff heatmap).
  occupancy: number;
  // -1..1 aggregate sentiment (drives light color temperature).
  sentiment: number;
  // Minutes.
  avgWaitMinutes: number;
  tables: CafeTable[];
  updatedAt: string;
}

export const MENU: Drink[] = [
  {
    id: "cortado",
    name: "Cortado",
    blurb: "Equal parts espresso and warm milk. Small, strong, smooth.",
    tags: ["espresso", "milky", "classic"],
    temp: "hot",
    priceCents: 420,
    caffeineMg: 130,
  },
  {
    id: "filter",
    name: "Single-Origin Filter",
    blurb: "Bright, floral pour-over that changes weekly.",
    tags: ["black", "bright", "nerdy"],
    temp: "hot",
    priceCents: 450,
    caffeineMg: 120,
  },
  {
    id: "iced-latte",
    name: "Iced Oat Latte",
    blurb: "Cold, creamy, oat-forward. The afternoon reset.",
    tags: ["milky", "cold", "mellow"],
    temp: "iced",
    priceCents: 520,
    caffeineMg: 110,
  },
  {
    id: "matcha",
    name: "Ceremonial Matcha",
    blurb: "Grassy, calm, steady lift without the jitters.",
    tags: ["green", "calm", "no-coffee"],
    temp: "hot",
    priceCents: 540,
    caffeineMg: 70,
  },
  {
    id: "cold-brew",
    name: "24h Cold Brew",
    blurb: "Slow-steeped, bold, low-acid. Built for deep work.",
    tags: ["black", "cold", "strong", "focus"],
    temp: "iced",
    priceCents: 500,
    caffeineMg: 200,
  },
  {
    id: "chai",
    name: "House Masala Chai",
    blurb: "Spiced, cozy, simmered with cardamom and ginger.",
    tags: ["spiced", "cozy", "milky", "no-coffee"],
    temp: "hot",
    priceCents: 460,
    caffeineMg: 50,
  },
];

export function drinkById(id: string): Drink | undefined {
  return MENU.find((d) => d.id === id);
}

// Deterministic-ish mock room so the staff view has life without a backend.
export function mockRoomState(now = new Date()): RoomState {
  const hour = now.getHours();
  // Morning + lunch rushes.
  const rushMorning = Math.max(0, 1 - Math.abs(hour - 9) / 3);
  const rushLunch = Math.max(0, 1 - Math.abs(hour - 13) / 3);
  const occupancy = Math.min(1, 0.2 + rushMorning * 0.7 + rushLunch * 0.6);

  const tables: CafeTable[] = [
    { id: "t1", x: -3, z: -2, occupied: occupancy > 0.3, interests: ["indie games", "filter coffee"] },
    { id: "t2", x: 0, z: -3, occupied: occupancy > 0.5, interests: ["design", "vinyl"] },
    { id: "t3", x: 3, z: -2, occupied: occupancy > 0.7, interests: ["startups", "running"] },
    { id: "t4", x: -2, z: 1, occupied: occupancy > 0.6, interests: ["books", "matcha"] },
    { id: "t5", x: 2, z: 1, occupied: occupancy > 0.8, interests: ["photography", "travel"] },
  ];

  return {
    occupancy,
    sentiment: 0.55 - occupancy * 0.4, // busier => slightly more strained
    avgWaitMinutes: Math.round(3 + occupancy * 9),
    tables,
    updatedAt: now.toISOString(),
  };
}
