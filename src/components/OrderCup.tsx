"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

/**
 * A cup that animates from the counter to the pickup shelf over the ETA window,
 * with a rising steam trail as the readiness indicator (not a progress bar).
 * `progress` is 0..1 (elapsed / etaMinutes).
 */
export default function OrderCup({
  progress,
  label,
}: {
  progress: number;
  label?: string;
}) {
  const group = useRef<THREE.Group>(null);
  const steamRefs = useRef<THREE.Mesh[]>([]);

  const start = new THREE.Vector3(0, 1.35, -4.4); // counter
  const end = new THREE.Vector3(2.6, 1.42, -4.6); // shelf

  useFrame((state) => {
    const p = Math.min(1, Math.max(0, progress));
    if (group.current) {
      group.current.position.lerpVectors(start, end, p);
      // small arc hop
      group.current.position.y += Math.sin(p * Math.PI) * 0.15;
    }
    const t = state.clock.elapsedTime;
    steamRefs.current.forEach((m, i) => {
      if (!m) return;
      const phase = (t * 0.6 + i * 0.33) % 1;
      m.position.y = 0.3 + phase * 0.5;
      (m.material as THREE.MeshStandardMaterial).opacity = (1 - phase) * 0.5;
    });
  });

  const done = progress >= 1;

  return (
    <group ref={group} position={start.toArray()}>
      {/* Cup */}
      <mesh castShadow>
        <cylinderGeometry args={[0.12, 0.09, 0.26, 20]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      {/* Lid */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.04, 20]} />
        <meshStandardMaterial color="#00754a" />
      </mesh>
      {/* Steam puffs */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) steamRefs.current[i] = el;
          }}
          position={[0, 0.3, 0]}
        >
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.4} />
        </mesh>
      ))}

      <Html position={[0, 0.5, 0]} center distanceFactor={7}>
        <div
          style={{
            background: done ? "rgba(0,117,74,0.96)" : "rgba(255,255,255,0.96)",
            border: "1px solid rgba(0,117,74,0.18)",
            boxShadow: "0 12px 32px rgba(0,63,42,0.14)",
            color: done ? "#ffffff" : "#1e3932",
            padding: "6px 10px",
            borderRadius: 10,
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          {done ? "Ready for pickup ☕" : label || "Brewing…"}
        </div>
      </Html>
    </group>
  );
}
