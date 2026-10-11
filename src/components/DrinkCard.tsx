"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Drink } from "@/lib/cafe";

/**
 * A floating menu card for one drink. The recommended drink `highlighted`
 * glows and drifts toward the viewer — discovery without a list.
 */
export default function DrinkCard({
  drink,
  position,
  highlighted = false,
  onSelect,
}: {
  drink: Drink;
  position: [number, number, number];
  highlighted?: boolean;
  onSelect: (drink: Drink) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!group.current) return;
    const floaty = Math.sin(t * 1.1 + position[0]) * 0.05;
    // Recommended card drifts slightly forward (toward +z / camera).
    const drift = highlighted ? Math.sin(t * 0.8) * 0.08 + 0.25 : 0;
    group.current.position.set(position[0], position[1] + floaty, position[2] + drift);
    const targetScale = hovered || highlighted ? 1.12 : 1;
    group.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );
  });

  const accent = drink.temp === "iced" ? "#00754a" : "#1e3932";

  return (
    <group
      ref={group}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(drink);
      }}
    >
      {/* Card panel */}
      <mesh castShadow>
        <boxGeometry args={[1.1, 1.5, 0.06]} />
        <meshStandardMaterial
          color={highlighted ? "#2a2030" : "#1c1620"}
          emissive={highlighted ? accent : "#000000"}
          emissiveIntensity={highlighted ? 0.5 : 0}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      {/* Accent bar */}
      <mesh position={[0, 0.6, 0.04]}>
        <boxGeometry args={[1.1, 0.12, 0.02]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} />
      </mesh>

      <Html position={[0, 0, 0.05]} center distanceFactor={6} occlude>
        <div
          style={{
            width: 150,
            textAlign: "center",
            color: "#1e3932",
            fontFamily: "system-ui, sans-serif",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700 }}>{drink.name}</div>
          <div style={{ fontSize: 10, color: accent, marginBottom: 4 }}>
            {drink.temp.toUpperCase()} · ${(drink.priceCents / 100).toFixed(2)}
          </div>
          <div style={{ fontSize: 10, color: "#c7bbae", lineHeight: 1.3 }}>
            {drink.blurb}
          </div>
          {highlighted ? (
            <div style={{ fontSize: 10, marginTop: 6, color: "#00754a" }}>
              ★ Today&apos;s pick for you
            </div>
          ) : null}
        </div>
      </Html>
    </group>
  );
}
