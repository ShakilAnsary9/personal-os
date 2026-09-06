import type { Metadata } from "next";
import "../landing.css";

export const metadata: Metadata = {
  title: "Personal OS — The daily cockpit for your whole life",
  description:
    "One page for tasks, habits, money and everything you're building. Offline-first, syncs when you're ready. Free to start, Pro unlocks money, content, projects, notes and reminders.",
  keywords: [
    "personal os",
    "daily planner",
    "task manager",
    "habits tracker",
    "money ledger",
    "productivity",
    "creator workflow",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Personal OS — The daily cockpit for your whole life",
    description:
      "One page for tasks, habits, money and everything you're building.",
    type: "website",
    url: "/",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
