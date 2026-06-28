import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Whiskr — Find & Rescue Stray Cats",
  description:
    "A live map for reporting, rescuing, and reuniting stray and missing cats.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
