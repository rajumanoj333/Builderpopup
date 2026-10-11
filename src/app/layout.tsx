import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brewmate — the walkable cafe companion",
  description:
    "A spatial, non-chat cafe experience powered by Gemini. Walk the room, discover drinks, feel the vibe.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
