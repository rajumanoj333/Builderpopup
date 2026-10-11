"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { MENU, availableSeats, drinkById, mockRoomState, type CafeTable, type Drink } from "@/lib/cafe";
import BrandMark from "@/components/BrandMark";
import CafeRoom from "@/components/CafeRoom";
import Mascot from "@/components/Mascot";
import OrderCup from "@/components/OrderCup";

interface Reco {
  drinkId: string;
  reason: string;
  source: string;
}

interface Eta {
  minutes: number;
  narration: string;
  source: string;
}

export default function CustomerPage() {
  const room = useMemo(() => mockRoomState(new Date(2026, 0, 1, 15)), []);
  const [entered, setEntered] = useState(false);
  const [leavingIntro, setLeavingIntro] = useState(false);
  const [reco, setReco] = useState<Reco | null>(null);
  const [eta, setEta] = useState<Eta | null>(null);
  const [orderProgress, setOrderProgress] = useState(0);
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);
  const [selectedTable, setSelectedTable] = useState<CafeTable | null>(null);
  const orderStart = useRef<number | null>(null);

  const openSeatCount = room.tables.reduce(
    (total, table) => total + availableSeats(table),
    0
  );

  useEffect(() => {
    if (!entered) return;
    fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hour: new Date().getHours(), history: [] }),
    })
      .then((response) => response.json())
      .then(setReco)
      .catch(() => setReco(null));
  }, [entered]);

  useEffect(() => {
    if (!eta) return;
    orderStart.current = Date.now();
    setOrderProgress(0);
    const totalMs = eta.minutes * 1000;
    const timer = window.setInterval(() => {
      if (orderStart.current === null) return;
      const progress = Math.min(1, (Date.now() - orderStart.current) / totalMs);
      setOrderProgress(progress);
      if (progress >= 1) window.clearInterval(timer);
    }, 60);
    return () => window.clearInterval(timer);
  }, [eta]);

  function enterCafe() {
    setLeavingIntro(true);
    window.setTimeout(() => setEntered(true), 480);
  }

  async function placeOrder(drink: Drink) {
    setSelectedDrink(drink);
    setEta(null);
    try {
      const response = await fetch("/api/eta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drinkId: drink.id }),
      });
      setEta(await response.json());
    } catch {
      setEta({ minutes: room.avgWaitMinutes, narration: "We’re preparing your drink.", source: "mock" });
    }
  }

  const recommendedDrink = reco ? drinkById(reco.drinkId) : undefined;
  const tableMessage = selectedTable
    ? availableSeats(selectedTable) === 0
      ? `${selectedTable.id} is full.`
      : `${selectedTable.id} has ${availableSeats(selectedTable)} open ${availableSeats(selectedTable) === 1 ? "seat" : "seats"}.`
    : undefined;
  const mascotSpeech = eta?.narration || tableMessage;

  return (
    <main className="full">
      {!entered ? (
        <section className={`intro${leavingIntro ? " intro--leaving" : ""}`}>
          <div className="intro__copy">
            <BrandMark />
            <div className="intro__eyebrow">Your café, made easier</div>
            <h1>Coffee, a seat, and less waiting.</h1>
            <p className="intro__lead">
              See open seats, choose a drink, and follow your order—all in one calm space.
            </p>
            <div className="intro__actions">
              <button className="primary-button" onClick={enterCafe}>
                Enter Brewmate
              </button>
              <Link className="text-link" href="/staff">
                Staff view
              </Link>
            </div>
          </div>
          <div className="intro__visual" aria-label={`${openSeatCount} seats currently open`}>
            <div className="intro__ring" />
            <div className="intro__seat-card">
              <span className="intro__seat-count">{openSeatCount}</span>
              <span className="intro__seat-label">seats open now</span>
              <p className="intro__seat-note">Green seats are ready. Tap a table to see its availability.</p>
            </div>
          </div>
        </section>
      ) : null}

      <header className="chrome">
        <div className="chrome__brand">
          <BrandMark />
        </div>
        <div className="chrome__links">
          <span className="chrome__status">{openSeatCount} seats open</span>
          <Link className="link-quiet" href="/staff">
            Staff view
          </Link>
        </div>
      </header>

      <aside className="seat-dock" aria-label="Seat availability">
        <div className="seat-dock__head">
          <span className="seat-dock__title">Find a seat</span>
          <span className="seat-dock__count">{openSeatCount} open</span>
        </div>
        <div className="seat-grid">
          {room.tables.map((table) => {
            const open = availableSeats(table);
            return (
              <button
                key={table.id}
                className={`seat-button${open === 0 ? " is-full" : ""}${selectedTable?.id === table.id ? " is-selected" : ""}`}
                onClick={() => setSelectedTable(table)}
                aria-label={`${table.id}: ${open === 0 ? "full" : `${open} seats open`}`}
              >
                <strong>{table.id}</strong>
                <span>{open === 0 ? "Full" : `${open} open`}</span>
              </button>
            );
          })}
        </div>
        <div className="seat-legend">
          <span>Available</span>
          <span>Occupied</span>
        </div>
      </aside>

      <aside className="menu" aria-label="Drink menu">
        <div className="menu-eyebrow">Menu · AI pick</div>
        <h2 className="menu-title">Choose your drink</h2>
        <p className="menu-note">
          {reco?.reason || "Finding a good choice for right now…"}
        </p>

        {MENU.map((drink) => {
          const isPick = recommendedDrink?.id === drink.id;
          const isSelected = selectedDrink?.id === drink.id;
          return (
            <button
              key={drink.id}
              className={`menu-item${isSelected ? " is-selected" : ""}`}
              onClick={() => placeOrder(drink)}
            >
              <div className="menu-item-row">
                <span className="menu-item-name">{drink.name}</span>
                <span className="menu-item-price">${(drink.priceCents / 100).toFixed(2)}</span>
              </div>
              <div className="menu-item-blurb">{drink.blurb}</div>
              {isPick ? <span className="menu-pick-tag">Recommended</span> : null}
            </button>
          );
        })}
      </aside>

      {selectedDrink && eta ? (
        <div className="order-pill" role="status">
          <div>
            <div style={{ fontSize: 14, fontWeight: 750 }}>{selectedDrink.name}</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
              {orderProgress >= 1 ? "Ready for pickup" : `Preparing · about ${eta.minutes} min`}
            </div>
          </div>
          <div className="order-progress" aria-hidden="true">
            <span style={{ width: `${Math.round(orderProgress * 100)}%` }} />
          </div>
        </div>
      ) : null}

      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 4.6, 7.2], fov: 45 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#d4e9e2"]} />
        <fog attach="fog" args={["#d4e9e2", 10, 22]} />
        <ambientLight intensity={1.15} />
        <hemisphereLight args={["#ffffff", "#d4e9e2", 0.75]} />
        <directionalLight position={[4, 8, 5]} intensity={1.5} color="#ffffff" castShadow />
        <pointLight position={[0, 3, -4]} intensity={0.75} color="#00754a" />

        <CafeRoom
          tables={room.tables}
          selectedTableId={selectedTable?.id}
          onTableSelect={setSelectedTable}
        />
        <Mascot position={[-1.4, 0, -3.35]} speech={mascotSpeech} mood={room.sentiment} />
        {selectedDrink && eta ? (
          <OrderCup progress={orderProgress} label={selectedDrink.name} />
        ) : null}

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate={!selectedTable}
          autoRotateSpeed={0.2}
          minPolarAngle={Math.PI / 3.6}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, 0.55, -1.5]}
        />
      </Canvas>
    </main>
  );
}
