import type { ReactNode } from "react";
import type { Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";

import "./nath.css";

const display = Newsreader({
  subsets: ["latin"],
  variable: "--nath-font-display",
  display: "swap",
});

const ui = Inter({
  subsets: ["latin"],
  variable: "--nath-font-ui",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1E1A19",
};

export default function NathLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className={`${display.variable} ${ui.variable} nath-root`}>
      {children}
    </div>
  );
}
