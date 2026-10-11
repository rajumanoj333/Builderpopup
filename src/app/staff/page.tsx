"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { CafeTable } from "@/lib/cafe";

interface RoomSummary {
  occupancy: number;
  sentiment: number;
  avgWaitMinutes: number;
  tables: CafeTable[];
  updatedAt: string;
  staffBrief: string;
  source: string;
}

/** Simple next-hour busy prediction from current occupancy + time of day. */
function predictBusy(occupancy: number): { label: string; level: number } {
  const hour = new Date().getHours();
  const trendingUp = hour < 9 || (hour >= 11 && hour < 13);
  const level = Math.min(1, occupancy + (trendingUp ? 0.2 : -0.1));
  const label =
    level > 0.75 ? "Rush incoming" : level > 0.45 ? "Steady" : "Quiet";
  return { label, level };
}

function TopDownRoom({ room }: { room: RoomSummary }) {
  // Sentiment -> warm/cool heat tint for the whole floor.
  const floorColor = new THREE.Color().lerpColors(
    new THREE.Color("#2d3a6b"),
    new THREE.Color("#6b3a2d"),
    (room.sentiment + 1) / 2
  );

  return (
    <group>
      <ambientLight intensity={0.8} />
      <directionalLight position={[0, 10, 2]} intensity={1} />

      {/* Floor heatmap */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color={floorColor} roughness={1} />
      </mesh>

      {/* Counter marker */}
      <mesh position={[0, 0.1, -5]}>
        <boxGeometry args={[6, 0.2, 1.2]} />
        <meshStandardMaterial color="#8a5a3c" />
      </mesh>

      {/* Tables with occupancy color + interest motes */}
      {room.tables.map((t) => (
        <group key={t.id} position={[t.x, 0, t.z]}>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.2, 24]} />
            <meshStandardMaterial
              color={t.occupied ? "#ff9f68" : "#4a4a55"}
              emissive={t.occupied ? "#ff6a3c" : "#000000"}
              emissiveIntensity={t.occupied ? 0.4 : 0}
            />
          </mesh>
          {/* Interest motes floating above occupied tables */}
          {t.occupied &&
            t.interests.map((_, i) => (
              <mesh key={i} position={[(i - 0.5) * 0.3, 0.6 + i * 0.15, 0]}>
                <sphereGeometry args={[0.06, 10, 10]} />
                <meshStandardMaterial
                  color="#8ec5ff"
                  emissive="#8ec5ff"
                  emissiveIntensity={0.6}
                />
              </mesh>
            ))}
        </group>
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={8}
        maxDistance={18}
        maxPolarAngle={Math.PI / 2.2}
      />
    </group>
  );
}

export default function StaffPage() {
  const [room, setRoom] = useState<RoomSummary | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/room")
        .then((r) => r.json())
        .then(setRoom)
        .catch(() => setRoom(null));
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, []);

  const busy = room ? predictBusy(room.occupancy) : { label: "—", level: 0 };

  return (
    <div className="full">
      {/* HUD panels */}
      <div className="hud" style={{ top: 16, left: 16 }}>
        <div className="badge">
          Staff god-view{room ? ` · ${room.source === "gemini" ? "Gemini live" : "demo mode"}` : ""}
        </div>
      </div>
      <div className="hud" style={{ top: 16, right: 16 }}>
        <Link className="badge" href="/">
          ← Customer view
        </Link>
      </div>

      <div
        className="hud"
        style={{ top: 70, left: 16, width: 300, display: "grid", gap: 12 }}
      >
        <div className="panel">
          <div style={{ fontSize: 12, letterSpacing: "0.08em" }} className="muted">
            THE ROOM RIGHT NOW
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            <Metric label="Occupancy" value={room ? `${Math.round(room.occupancy * 100)}%` : "—"} />
            <Metric label="Avg wait" value={room ? `${room.avgWaitMinutes}m` : "—"} />
            <Metric
              label="Sentiment"
              value={room ? sentimentLabel(room.sentiment) : "—"}
            />
          </div>
        </div>

        <div className="panel">
          <div style={{ fontSize: 12, letterSpacing: "0.08em" }} className="muted">
            BUSY PREDICTION (NEXT HOUR)
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>
            {busy.label}
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: "rgba(255,255,255,0.1)",
              marginTop: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round(busy.level * 100)}%`,
                background: "linear-gradient(90deg,#ffd9ab,#ff6a3c)",
              }}
            />
          </div>
        </div>

        <div className="panel">
          <div style={{ fontSize: 12, letterSpacing: "0.08em" }} className="muted">
            BREWMATE ADVISES
          </div>
          <div style={{ marginTop: 8, lineHeight: 1.4 }}>
            {room?.staffBrief || "Reading the room…"}
          </div>
        </div>
      </div>

      <Canvas shadows camera={{ position: [0, 12, 6], fov: 50 }}>
        <color attach="background" args={["#0d0b10"]} />
        {room ? (
          <TopDownRoom room={room} />
        ) : (
          <ambientLight intensity={0.5} />
        )}
      </Canvas>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      <div className="muted" style={{ fontSize: 11 }}>
        {label}
      </div>
    </div>
  );
}

function sentimentLabel(s: number): string {
  if (s > 0.4) return "Great";
  if (s > 0.1) return "Good";
  if (s > -0.2) return "Okay";
  return "Tense";
}
