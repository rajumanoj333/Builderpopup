"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import { MENU, drinkById, mockRoomState, type Drink } from "@/lib/cafe";
import CafeRoom from "@/components/CafeRoom";
import DrinkCard from "@/components/DrinkCard";
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
  const mascotSpeech = eta?.narration || reco?.reason || "Welcome in! Let me find your drink.";

  // Lay the 6 cards along the back as a floating menu board.
  const cardPositions: [number, number, number][] = MENU.map((_, i) => {
    const col = i % 3;
    const rowY = i < 3 ? 2.6 : 1.0;
    return [(col - 1) * 1.5, rowY, -4.2];
  });

  if (!entered) {
    return (
      <div className="landing">
        <div className="landing-inner">
          <h1>Brewmate</h1>
          <p>
            A walkable café where the room is the interface. No chat box — just
            step in, meet your barista, and let the right drink find you.
          </p>
          <div className="cta-row">
            <button className="btn" onClick={() => setEntered(true)}>
              ☕ Enter the café
            </button>
            <Link className="btn" href="/staff" style={{ opacity: 0.85 }}>
              Staff god-view →
            </Link>
          </div>
          <div className="hint">
            Drag to look around · click a glowing card to order
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="full">
      {/* HUD */}
      <div className="hud" style={{ top: 16, left: 16 }}>
        <div className="badge">
          Brewmate{reco ? ` · ${reco.source === "gemini" ? "Gemini live" : "demo mode"}` : ""}
        </div>
      </div>
      <div className="hud" style={{ top: 16, right: 16 }}>
        <Link className="badge" href="/staff">
          Staff view →
        </Link>
      </div>

      {selected && eta ? (
        <div className="hud" style={{ bottom: 20, left: "50%", transform: "translateX(-50%)" }}>
          <div className="panel" style={{ textAlign: "center", minWidth: 260 }}>
            <div style={{ fontWeight: 700 }}>{selected.name}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {orderProgress >= 1
                ? "Ready for pickup ☕"
                : `Ready in ~${eta.minutes} min · ${Math.round(orderProgress * 100)}%`}
            </div>
          </div>
        </div>
      ) : null}

      <Canvas shadows camera={{ position: [0, 1.6, 4], fov: 60 }}>
        <color attach="background" args={["#120d16"]} />
        <fog attach="fog" args={["#120d16", 8, 20]} />

        {/* Sentiment lighting: warmer when the room feels good */}
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[3, 6, 4]}
          intensity={1.1}
          color={new THREE.Color().lerpColors(
            new THREE.Color("#9fb4ff"),
            new THREE.Color("#ffcf9e"),
            (room.sentiment + 1) / 2
          )}
          castShadow
        />
        <pointLight position={[0, 3, -4]} intensity={0.6} color="#ffb27a" />

        <CafeRoom tables={room.tables} occupancy={room.occupancy} />

        <Mascot position={[-1.6, 0, -3.4]} speech={mascotSpeech} mood={room.sentiment} />

        {MENU.map((drink, i) => (
          <DrinkCard
            key={drink.id}
            drink={drink}
            position={cardPositions[i]}
            highlighted={recommendedDrink?.id === drink.id}
            onSelect={placeOrder}
          />
        ))}

        {selected && eta ? (
          <OrderCup progress={orderProgress} label={`${selected.name}…`} />
        ) : null}

        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={8}
          maxPolarAngle={Math.PI / 2}
          target={[0, 1.4, -3]}
        />
        <Environment preset="apartment" />
      </Canvas>
    </div>
  );
}
