"use client";

import { ContainerScroll } from "../ui/animations/container-scroll-animation";

export function HeroScrollDemo() {
  return (
    <div className="relative flex flex-col overflow-hidden w-full">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="relative text-3xl sm:text-4xl lg:text-7xl cursor-default font-semibold text-black dark:text-white">
              Unleash the power of <br />
              <span className="relative text-3xl sm:text-4xl lg:text-7xl md:text-[6rem] font-bold mt-1 leading-none">
                Timeline
              </span>
            </h1>

            <br />
          </>
        }
      >
        <img
          src={`https://res.cloudinary.com/dsuafua4l/image/upload/v1758289309/Timeline/frontend/public/platform_screenshots/dark/board.png`}
          alt="hero"
          className="relative mx-auto rounded-2xl object-cover h-full object-left-top dark:block hidden"
          // style={{ maxHeight: '720px', maxWidth: '1400px' }}
          draggable={false}
          loading="eager"
          decoding="sync"
        />
        <img
          src={`https://res.cloudinary.com/dsuafua4l/image/upload/v1758289309/Timeline/frontend/public/platform_screenshots/light/board.png`}
          alt="hero"
          className="relative mx-auto rounded-2xl object-cover h-full object-left-top dark:hidden block"
          // style={{ maxHeight: '720px', maxWidth: '1400px' }}
          draggable={false}
          loading="eager"
          decoding="sync"
        />
      </ContainerScroll>
    </div>
  );
}
