"use client";

import { Card, Carousel } from "../ui/animations/apple-cards-carousel";
import { useTheme } from "@/context/theme-context";
import { useEffect, useState } from "react";

export function AppleCardsCarouselDemo() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use resolvedTheme to get the actual theme (handles system theme)
  const currentTheme = mounted ? resolvedTheme : 'light';

  // Cloudinary base URL for platform screenshots
  const CLOUDINARY_BASE = "https://res.cloudinary.com/dsuafua4l/image/upload/v1758289309/Timeline/frontend/public/platform_screenshots";
  const BASE_PATH = `${CLOUDINARY_BASE}/${currentTheme}`;

  const data = [
    {
      category: "Drag and drop",
      title: "Board",
      src: `${BASE_PATH}/board.png`,
      fallbackSrc: `${CLOUDINARY_BASE}/dark/board.png`, // Fallback for missing dark images
    },
    {
      category: "See in list view ",
      title: "List",
      src: `${BASE_PATH}/list.png`,
      fallbackSrc: `${CLOUDINARY_BASE}/dark/list.png`,
    },
    {
      category: "Calendar",
      title: "Your calendar",
      src: `${BASE_PATH}/calendar.png`,
      fallbackSrc: `${CLOUDINARY_BASE}/dark/calendar.png`,
    },
    {
      category: "Dashboard",
      title: "Your dashboard",
      src: `${BASE_PATH}/dashboard.png`,
      fallbackSrc: `${CLOUDINARY_BASE}/dark/dashboard.png`,
    },
    {
      category: "Create and Invite",
      title: "Create new workspaces",
      src: `${BASE_PATH}/invite.png`,
      fallbackSrc: `${CLOUDINARY_BASE}/dark/invite.png`,
    },
    {
      category: "Analytics",
      title: "Interactive UI Analytics",
      src: `${BASE_PATH}/analytics.png`,
      fallbackSrc: `${CLOUDINARY_BASE}/dark/analytics.png`,
    },
  ];

  const cards = data.map((card) => (
    <Card key={card.src} card={card} />
  ));

  return (
    <div className="w-full h-full md:py-20 pb-10 pt-4">
      <h2 id="demo" className="max-w-7xl pl-4 mx-auto text-xl md:text-5xl font-bold text-neutral-800 dark:text-neutral-200 font-sans">
        Get to know Timeline (Sneak peak).
      </h2>
      <Carousel items={cards} />
    </div>
  );
}
