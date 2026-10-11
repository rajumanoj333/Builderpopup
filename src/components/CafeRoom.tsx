"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
import type { CafeTable } from "@/lib/cafe";
import { availableSeats } from "@/lib/cafe";

export default function CafeRoom({
  tables,
  selectedTableId,
  onTableSelect,
}: {
  tables: CafeTable[];
  selectedTableId?: string | null;
  onTableSelect?: (table: CafeTable) => void;
}) {
  const occupiedFigures = useMemo(
    () =>
      tables.flatMap((table) =>
        Array.from({ length: table.occupiedSeats }, (_, seatIndex) => ({
          id: `${table.id}-${seatIndex}`,
          x: table.x + (seatIndex === 0 ? -0.78 : 0.78),
          z: table.z,
        }))
      ),
    [tables]
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#d4e9e2" roughness={0.95} />
      </mesh>

      <mesh position={[0, 2.5, -7]} receiveShadow>
        <boxGeometry args={[16, 5, 0.3]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[-8, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.3, 5, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[8, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.3, 5, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.6, -5]} castShadow receiveShadow>
        <boxGeometry args={[6, 1.2, 1.2]} />
        <meshStandardMaterial color="#00754a" roughness={0.65} />
      </mesh>
      <mesh position={[0, 1.22, -5]} castShadow>
        <boxGeometry args={[6.2, 0.08, 1.4]} />
        <meshStandardMaterial color="#1e3932" roughness={0.45} />
      </mesh>

      {tables.map((table) => {
        const open = availableSeats(table);
        const selected = selectedTableId === table.id;
        return (
          <group
            key={table.id}
            position={[table.x, 0, table.z]}
            onClick={(event) => {
              event.stopPropagation();
              onTableSelect?.(table);
            }}
            onPointerEnter={() => {
              document.body.style.cursor = "pointer";
            }}
            onPointerLeave={() => {
              document.body.style.cursor = "default";
            }}
          >
            {selected ? (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
                <ringGeometry args={[0.8, 0.92, 36]} />
                <meshBasicMaterial color="#00754a" transparent opacity={0.75} />
              </mesh>
            ) : null}

            <mesh position={[0, 0.53, 0]} castShadow>
              <cylinderGeometry args={[0.55, 0.55, 0.08, 28]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.27, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.52, 12]} />
              <meshStandardMaterial color="#1e3932" />
            </mesh>

            {[0, 1].map((seatIndex) => {
              const isOccupied = seatIndex < table.occupiedSeats;
              const x = seatIndex === 0 ? -0.78 : 0.78;
              return (
                <group key={seatIndex} position={[x, 0, 0]}>
                  <mesh position={[0, 0.28, 0]} castShadow>
                    <cylinderGeometry args={[0.25, 0.25, 0.12, 20]} />
                    <meshStandardMaterial
                      color={isOccupied ? "#1e3932" : "#00754a"}
                      emissive={isOccupied ? "#000000" : "#00754a"}
                      emissiveIntensity={isOccupied ? 0 : 0.12}
                      roughness={0.65}
                    />
                  </mesh>
                  <mesh position={[0, 0.13, 0]}>
                    <cylinderGeometry args={[0.035, 0.035, 0.27, 10]} />
                    <meshStandardMaterial color="#1e3932" />
                  </mesh>
                  {!isOccupied ? (
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                      <ringGeometry args={[0.31, 0.36, 24]} />
                      <meshBasicMaterial color="#00754a" transparent opacity={0.55} />
                    </mesh>
                  ) : null}
                </group>
              );
            })}

            {selected ? (
              <Html position={[0, 1.12, 0]} center distanceFactor={8}>
                <div
                  style={{
                    minWidth: 126,
                    padding: "9px 12px",
                    border: "1px solid rgba(0,117,74,.16)",
                    borderRadius: 12,
                    background: "rgba(255,255,255,.96)",
                    color: "#1e3932",
                    boxShadow: "0 12px 32px rgba(0,63,42,.14)",
                    fontFamily: "system-ui, sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {table.id} · {open ? `${open} open` : "Full"}
                </div>
              </Html>
            ) : null}
          </group>
        );
      })}

      {occupiedFigures.map((figure) => (
        <mesh key={figure.id} position={[figure.x, 0.72, figure.z]} castShadow>
          <capsuleGeometry args={[0.2, 0.48, 6, 12]} />
          <meshStandardMaterial color="#000000" roughness={0.85} />
        </mesh>
      ))}

      <mesh position={[2.6, 1.3, -4.6]} castShadow>
        <boxGeometry args={[1.4, 0.08, 0.6]} />
        <meshStandardMaterial color="#1e3932" roughness={0.45} />
      </mesh>
    </group>
  );
}
