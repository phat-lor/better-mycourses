"use client";

import { Button, Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Github } from "lucide-react";
import BasicNavbar from "./basic-navbar";
import BeforeAfterSlider from "./before-after-slider";
import FadeInImage from "./fade-in-image";

export default function Landing() {
  return (
    <div className="bg-background relative flex h-screen min-h-dvh w-full flex-col overflow-hidden overflow-y-auto">
      <BasicNavbar />
      <main className="flex flex-col items-center rounded-2xl px-3 md:rounded-3xl md:px-0">
        <section className="z-20 my-14 flex flex-col items-center justify-center gap-[18px] sm:gap-6">
          <Button
            className="border-default-100 bg-default-50 text-small text-default-500 h-9 overflow-hidden border-1 px-[18px] py-2 leading-5 font-normal"
            startContent={
              <Icon
                className="flex-none outline-hidden [&>path]:stroke-2"
                icon="fluent-emoji-flat:weary-cat"
                width={20}
              />
            }
            radius="full"
            variant="bordered"
          >
            Only works for ICT Mahidol Moodle right now!!
          </Button>
          <div className="text-center text-[clamp(40px,10vw,44px)] leading-[1.2] font-bold tracking-tighter sm:text-[64px]">
            <div className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
              The MyCourses <br /> replacement you never <br /> knew you needed.
            </div>
          </div>
          <p className="text-default-500 text-center leading-7 font-normal sm:w-[466px] sm:text-[18px]">
            Transform your Moodle experience with Adderall. Clean interface,
            better navigation, and all the features you wish MyCourses had from
            the start.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
            <Button
              className="bg-default-foreground text-small text-background h-10 w-[163px] px-[16px] py-[10px] leading-5 font-medium"
              radius="full"
              as={Link}
              href="https://github.com/phat-lor/better-mycourses"
              target="_blank"
              rel="noopener noreferrer"
              startContent={<Github size={16} />}
            >
              Check GitHub out
            </Button>
            <Button
              className="bg-default-100 text-small h-10 w-[163px] border-1 px-[16px] py-[10px] leading-5 font-medium"
              endContent={
                <span className="bg-default-100 pointer-events-none flex h-[22px] w-[22px] items-center justify-center rounded-full">
                  <Icon
                    className="text-default-500 [&>path]:stroke-[1.5]"
                    icon="solar:arrow-right-linear"
                    width={16}
                  />
                </span>
              }
              radius="full"
              variant="bordered"
            >
              Get Started
            </Button>
          </div>
        </section>
        <div className="z-20 mt-auto w-[calc(100%-calc(--spacing(4)*2))] max-w-6xl overflow-hidden rounded-tl-2xl rounded-tr-2xl border-1 border-b-0 border-[#FFFFFF1A] bg-transparent p-4">
          <BeforeAfterSlider />
        </div>
      </main>
      <div className="pointer-events-none inset-0 top-[-25%] z-10 scale-150 select-none sm:absolute sm:scale-125">
        <FadeInImage
          alt="Gradient background"
          src="data:image/svg+xml,%3Csvg width='1200' height='800' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3CradialGradient id='grad' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' style='stop-color:%23667eea%3Bstop-opacity:0.1'/%3E%3Cstop offset='100%25' style='stop-color:%23764ba2%3Bstop-opacity:0.05'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grad)'/%3E%3C/svg%3E"
        />
      </div>
    </div>
  );
}
