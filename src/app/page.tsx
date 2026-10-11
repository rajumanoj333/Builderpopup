"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import { MENU, drinkById, mockRoomState, type Drink } from "@/lib/cafe";
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
  const [entered, setEntered] = useState(false);
  const [reco, setReco] = useState<Reco | null>(null);
  const [eta, setEta] = useState<Eta | null>(null);
  const [orderProgress, setOrderProgress] = useState(0);
  const [selected, setSelected] = useState<Drink | null>(null);
  const orderStart = useRef<number | null>(null);

  const room = mockRoomState();

  // Fetch recommendation once the customer enters.
  useEffect(() => {
    if (!entered) return;
    const hour = new Date().getHours();
    fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hour, history: [] }),
    })
      .then((r) => r.json())
      .then(setReco)
      .catch(() => setReco(null));
  }, [entered]);

  // Drive the order animation clock.
  useEffect(() => {
    if (!eta) return;
    orderStart.current = Date.now();
    setOrderProgress(0);
    const totalMs = eta.minutes * 1000; // demo: 1s per "minute"
    const id = setInterval(() => {
      if (orderStart.current == null) return;
      const p = Math.min(1, (Date.now() - orderStart.current) / totalMs);
      setOrderProgress(p);
      if (p >= 1) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [eta]);

  async function placeOrder(drink: Drink) {
    setSelected(drink);
    setEta(null);
    const res = await fetch("/api/eta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drinkId: drink.id }),
    });
    const data: Eta = await res.json();
    setEta(data);
  }

  const recommendedDrink = reco ? drinkById(reco.drinkId) : undefined;
  const mascotSpeech =
    eta?.narration || reco?.reason || "Welcome in. Let me find your drink.";

  if (!entered) {
    return (
      <div className="landing">
        <div className="landing-inner">
          <h1>Brewmate</h1>
          <p>
            A calm café where the room is the interface. No chat box — step in,
            meet your barista, and let the right drink find you.
          </p>
          <div className="cta-row">
            <button className="btn" onClick={() => setEntered(true)}>
              Enter the café
            </button>
            <Link className="btn" href="/staff" style={{ opacity: 0.8 }}>
              Staff view
            </Link>
          </div>
          <div className="hint">Drag to look around · pick a drink from the menu</div>
        </div>
      </div>
    );
  }

  return (
    <div className="full">
      {/* Thin top chrome */}
      <div className="chrome">
        <div className="brand">
          brewmate<span className="brand-dot">.</span>
        </div>
        <Link className="link-quiet" href="/staff">
          Staff view →
        </Link>
      </div>

      {/* Minimal menu overlay */}
      <div className="menu">
        <div className="menu-eyebrow">
          {reco ? (reco.source === "gemini" ? "Curated by Gemini" : "Today") : "Menu"}
        </div>
        <div className="menu-title">What are you having?</div>

        {MENU.map((drink, i) => {
          const isPick = recommendedDrink?.id === drink.id;
          return (
            <button
              key={drink.id}
              className={`menu-item${isPick ? " pick" : ""}`}
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => placeOrder(drink)}
            >
              <div className="menu-item-row">
                <span className="menu-item-name">{drink.name}</span>
                <span className="menu-item-price">
                  ${(drink.priceCents / 100).toFixed(2)}
                </span>
              </div>
              <div className="menu-item-blurb">{drink.blurb}</div>
              {isPick ? (
                <span className="menu-pick-tag">★ Picked for you</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Order status pill */}
      {selected && eta ? (
        <div className="order-pill">
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{selected.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              {orderProgress >= 1
                ? "Ready for pickup"
                : `Ready in ~${eta.minutes} min`}
            </div>
          </div>
          <div className="order-progress">
            <span style={{ width: `${Math.round(orderProgress * 100)}%` }} />
          </div>
        </div>
      ) : null}

      <Canvas
        shadows
        camera={{ position: [0, 1.6, 4.5], fov: 50 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#0f0c12"]} />
        <fog attach="fog" args={["#0f0c12", 7, 18]} />

        {/* Soft, warm sentiment lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[3, 6, 4]}
          intensity={0.9}
          color={new THREE.Color().lerpColors(
            new THREE.Color("#aebbff"),
            new THREE.Color("#ffd2a6"),
            (room.sentiment + 1) / 2
          )}
          castShadow
        />
        <pointLight position={[0, 3, -4]} intensity={0.5} color="#ffb27a" />

        <CafeRoom tables={room.tables} occupancy={room.occupancy} />

        <Mascot position={[-1.4, 0, -3.2]} speech={mascotSpeech} mood={room.sentiment} />

        {selected && eta ? (
          <OrderCup progress={orderProgress} label={`${selected.name}…`} />
        ) : null}

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.35}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
          target={[0, 1.3, -3]}
        />
        <Environment preset="apartment" />
      </Canvas>
    </div>
  );
}
