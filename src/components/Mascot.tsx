"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

/**
 * Brewmate — an animated barista mascot. It bobs gently, blinks, and shows a
 * speech label. This is the "agent" embodiment that replaces a chat box.
 */
export default function Mascot({
  position = [0, 0, 0],
  speech,
  mood = 0.6,
}: {
  position?: [number, number, number];
  speech?: string;
  mood?: number; // -1..1, tints the mascot slightly
}) {
  const group = useRef<THREE.Group>(null);
  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.position.y = position[1] + Math.sin(t * 1.6) * 0.06;
      group.current.rotation.y = Math.sin(t * 0.4) * 0.2;
    }
    // Blink: squash eyes periodically.
    const blink = Math.max(0, Math.sin(t * 1.3) > 0.98 ? 0.1 : 1);
    if (eyeL.current) eyeL.current.scale.y = blink;
    if (eyeR.current) eyeR.current.scale.y = blink;
  });

  const bodyColor = new THREE.Color().lerpColors(
    new THREE.Color("#8a5a3c"),
    new THREE.Color("#d98a4e"),
    (mood + 1) / 2
  );

  return (
    <group ref={group} position={position}>
      {/* Body */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.35, 0.5, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 1.15, 0]}>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} />
      </mesh>
      {/* Eyes */}
      <mesh ref={eyeL} position={[-0.1, 1.2, 0.26]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color="#140f0a" />
      </mesh>
      <mesh ref={eyeR} position={[0.1, 1.2, 0.26]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color="#140f0a" />
      </mesh>
      {/* Little apron badge */}
      <mesh position={[0, 0.55, 0.33]}>
        <circleGeometry args={[0.08, 20]} />
        <meshStandardMaterial color="#ffd9ab" />
      </mesh>

      {speech ? (
        <Html position={[0, 1.8, 0]} center distanceFactor={8}>
          <div
            style={{
              background: "rgba(18,14,22,0.9)",
              border: "1px solid rgba(255,196,140,0.4)",
              color: "#f4efe9",
              padding: "8px 12px",
              borderRadius: 12,
              fontSize: 13,
              maxWidth: 220,
              textAlign: "center",
              lineHeight: 1.35,
            }}
          >
            {speech}
          </div>
        </Html>
      ) : null}
    </group>
  );
}
