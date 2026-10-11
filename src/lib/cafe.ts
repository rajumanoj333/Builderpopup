// Shared domain model for Brewmate.

export type DrinkTemp = "hot" | "iced";

export interface Drink {
  id: string;
  name: string;
  blurb: string;
  tags: string[];
  temp: DrinkTemp;
  priceCents: number;
  caffeineMg: number;
}

export interface CafeTable {
  id: string;
  x: number;
  z: number;
  seats: number;
  occupiedSeats: number;
  occupied: boolean;
  interests: string[];
}

export interface RoomState {
  occupancy: number;
  sentiment: number;
  avgWaitMinutes: number;
  tables: CafeTable[];
  updatedAt: string;
}

export const MENU: Drink[] = [
  {
    id: "cortado",
    name: "Cortado",
    blurb: "Espresso softened with warm milk.",
    tags: ["espresso", "milky", "classic"],
    temp: "hot",
    priceCents: 420,
    caffeineMg: 130,
  },
  {
    id: "filter",
    name: "Fresh Filter",
    blurb: "Bright, smooth, and freshly brewed.",
    tags: ["black", "bright"],
    temp: "hot",
    priceCents: 450,
    caffeineMg: 120,
  },
  {
    id: "iced-latte",
    name: "Iced Oat Latte",
    blurb: "Espresso and oat milk, served cold.",
    tags: ["milky", "cold", "mellow"],
    temp: "iced",
    priceCents: 520,
    caffeineMg: 110,
  },
  {
    id: "matcha",
    name: "Matcha Latte",
    blurb: "Smooth matcha with steamed milk.",
    tags: ["green", "calm", "no-coffee"],
    temp: "hot",
    priceCents: 540,
    caffeineMg: 70,
  },
  {
    id: "cold-brew",
    name: "Cold Brew",
    blurb: "Slow-steeped and refreshingly bold.",
    tags: ["black", "cold", "strong"],
    temp: "iced",
    priceCents: 500,
    caffeineMg: 200,
  },
  {
    id: "chai",
    name: "Masala Chai",
    blurb: "Warm spices with steamed milk.",
    tags: ["spiced", "cozy", "milky", "no-coffee"],
    temp: "hot",
    priceCents: 460,
    caffeineMg: 50,
  },
];

export function drinkById(id: string): Drink | undefined {
  return MENU.find((drink) => drink.id === id);
}

export function availableSeats(table: CafeTable): number {
  return Math.max(0, table.seats - table.occupiedSeats);
}

export function mockRoomState(now = new Date()): RoomState {
  const hour = now.getHours();
  const rushMorning = Math.max(0, 1 - Math.abs(hour - 9) / 3);
  const rushLunch = Math.max(0, 1 - Math.abs(hour - 13) / 3);
  const occupancy = Math.min(1, 0.2 + rushMorning * 0.7 + rushLunch * 0.6);

  const tableLayout = [
    { id: "T1", x: -3, z: -2, interests: ["indie games", "filter coffee"] },
    { id: "T2", x: 0, z: -3, interests: ["design", "vinyl"] },
    { id: "T3", x: 3, z: -2, interests: ["startups", "running"] },
    { id: "T4", x: -2, z: 1, interests: ["books", "matcha"] },
    { id: "T5", x: 2, z: 1, interests: ["photography", "travel"] },
  ];

  let seatsToFill = Math.round(occupancy * tableLayout.length * 2);
  const tables: CafeTable[] = tableLayout.map((table) => {
    const occupiedSeats = Math.min(2, seatsToFill);
    seatsToFill -= occupiedSeats;
    return {
      ...table,
      seats: 2,
      occupiedSeats,
      occupied: occupiedSeats === 2,
    };
  });

  return {
    occupancy,
    sentiment: 0.55 - occupancy * 0.4,
    avgWaitMinutes: Math.round(3 + occupancy * 9),
    tables,
    updatedAt: now.toISOString(),
  };
}
