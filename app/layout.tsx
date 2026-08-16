import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nearbound — family trips that actually fit",
  description: "A constraint-first family trip matcher for short escapes around Cascadia.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
