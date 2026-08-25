import type { ReactNode } from "react";
import type { Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";

import "./nath.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#560319",
};

export default function NathLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className={`${display.variable} ${body.variable} nath-root`}>
      {children}
    </div>
  );
}
