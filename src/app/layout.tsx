import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--fd",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlex = IBM_Plex_Mono({
  variable: "--fm",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Personal OS",
  description: "All-in-one life dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} ${ibmPlex.variable}`}>
      <body>{children}</body>
    </html>
  );
}
