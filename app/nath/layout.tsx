import type { ReactNode } from "react";
import type { Viewport } from "next";

import "./nath.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F2F2F7",
};

export default function NathLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="nath-root">
      {children}
    </div>
  );
}
