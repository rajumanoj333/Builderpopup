"use client";

import { useMemo } from "react";
import type { CafeTable } from "@/lib/cafe";

/**
 * Static-ish room geometry: floor, walls, counter, tables, and ambient seated
 * figures whose count scales with occupancy. Lighting is handled by the parent
 * scene so both customer and staff views can share the sentiment rig.
 */
export default function CafeRoom({
  tables,
  occupancy,
}: {
  tables: CafeTable[];
  occupancy: number;
}) {
  const figureCount = Math.round(occupancy * tables.length);

  const seatedFigures = useMemo(
    () =>
      tables.slice(0, figureCount).map((t) => ({
        id: t.id,
        x: t.x,
        z: t.z,
      })),
    [tables, figureCount]
  );

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#2a211c" roughness={0.9} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 2.5, -7]} receiveShadow>
        <boxGeometry args={[16, 5, 0.3]} />
        <meshStandardMaterial color="#3a2d28" roughness={0.8} />
      </mesh>
      {/* Side walls */}
      <mesh position={[-8, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.3, 5, 16]} />
        <meshStandardMaterial color="#352a25" roughness={0.8} />
      </mesh>
      <mesh position={[8, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.3, 5, 16]} />
        <meshStandardMaterial color="#352a25" roughness={0.8} />
      </mesh>

      {/* Counter */}
      <mesh position={[0, 0.6, -5]} castShadow receiveShadow>
        <boxGeometry args={[6, 1.2, 1.2]} />
        <meshStandardMaterial color="#4a3328" roughness={0.6} />
      </mesh>
      {/* Counter top */}
      <mesh position={[0, 1.22, -5]}>
        <boxGeometry args={[6.2, 0.08, 1.4]} />
        <meshStandardMaterial color="#8a5a3c" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Tables + chairs + optional seated figure */}
      {tables.map((t) => (
        <group key={t.id} position={[t.x, 0, t.z]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.5, 0.08, 24]} />
            <meshStandardMaterial color="#5a4030" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.5, 12]} />
            <meshStandardMaterial color="#2e221c" />
          </mesh>
        </group>
      ))}

      {/* Ambient seated figures (simple capsules) */}
      {seatedFigures.map((f) => (
        <mesh key={`fig-${f.id}`} position={[f.x + 0.7, 0.6, f.z]} castShadow>
          <capsuleGeometry args={[0.22, 0.5, 6, 12]} />
          <meshStandardMaterial color="#6b6b7a" roughness={0.8} />
        </mesh>
      ))}

      {/* Pickup shelf (where finished orders land) */}
      <mesh position={[2.6, 1.3, -4.6]} castShadow>
        <boxGeometry args={[1.4, 0.08, 0.6]} />
        <meshStandardMaterial color="#8a5a3c" roughness={0.4} />
      </mesh>
    </group>
  );
}
