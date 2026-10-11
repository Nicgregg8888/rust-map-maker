import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const body = Inter({ variable: "--font-inter", subsets: ["latin"] });
const display = Oswald({ variable: "--font-oswald", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rust Base Finder",
  description:
    "Enter your server's map seed and size and find the best places to build your base, scored for your group size, playstyle and wipe stage.",
};

export const viewport: Viewport = {
  themeColor: "#11100e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
