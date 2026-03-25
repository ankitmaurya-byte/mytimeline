// NavigationMenuDemo.js
"use client";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { NavigationItem } from "./NavigationItem";

interface NavLink {
  title: string;
  href: string;
  children: {
    title: string;
    description: string;
    href: string;
  }[];
  asChild?: {
    title: string;
    description: string;
    href: string;
  };
}

interface NavigationMenuMainProps {
  navLinks: NavLink[];
}

export function NavigationMenuMain({ navLinks }: NavigationMenuMainProps) {

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {navLinks.map((link: NavLink) => (
          <NavigationItem key={link.title} link={link} />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
