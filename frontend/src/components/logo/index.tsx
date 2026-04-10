"use client";
import React from "react";
import Link from "next/link";
import { useTheme } from "@/context/theme-context";

type LogoProps = {
  url?: string;
  isLink?: boolean;
  imgSrc?: string;
  isDark?: boolean;
  isLight?: boolean;
};

const Logo = (props: LogoProps) => {
  const { url = "/", isLink = true, imgSrc } = props;
  const { resolvedTheme } = useTheme();

  // Optimize image sizes based on display size (144x144 max)
  const cloudName = process.env["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"];
  const lightLogoSrc = cloudName
    ? `https://res.cloudinary.com/${cloudName}/image/upload/w_200,h_200,c_limit,q_auto:good,f_auto,dpr_auto/Timeline/lightThemeLogo.png`
    : "";
  const darkLogoSrc = cloudName
    ? `https://res.cloudinary.com/${cloudName}/image/upload/w_200,h_200,c_limit,q_auto:good,f_auto,dpr_auto/Timeline/darkThemeLogo.png`
    : undefined;

  const logoContent = imgSrc ? (
    <img
      key="custom"
      src={imgSrc}
      alt="Logo"
      className="size-32 object-contain rounded-md"
      width="128"
      height="128"
      loading="lazy"
    />
  ) : resolvedTheme === 'dark' ? (
    <img
      key="dark"
      src={darkLogoSrc}
      alt="Logo"
      className="h-36 min-w-0 rounded-md"
      width="144"
      height="144"
      loading="eager"
    />
  ) : (
    <img
      key="light"
      src={lightLogoSrc}
      alt="Logo"
      className="h-36 min-w-0 rounded-md"
      width="144"
      height="144"
      loading="eager"
    />
  );

  return (
    <div className="flex items-center justify-center sm:justify-start relative">
      {isLink ? (
        <Link href={url}>
          {logoContent}
        </Link>
      ) : (
        logoContent
      )}
    </div>
  );
};

export default Logo;
