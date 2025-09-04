"use client";

import type { NavbarProps } from "@heroui/react";
import {
  Button,
  cn,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/react";
import { ChevronRight, FastForward, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";

const menuItems = ["About", "Features", "Documentation", "Contact"];

const BasicNavbar = React.forwardRef<HTMLElement, NavbarProps>(
  ({ classNames = {}, ...props }, ref) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    const { theme, setTheme } = useTheme();

    React.useEffect(() => {
      setMounted(true);
    }, []);

    return (
      <Navbar
        ref={ref}
        {...props}
        classNames={{
          base: cn("border-default-100 bg-transparent", {
            "bg-default-200/50 dark:bg-default-100/50": isMenuOpen,
          }),
          wrapper: "w-full justify-center",
          item: "hidden md:flex",
          ...classNames,
        }}
        height="60px"
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
      >
        <NavbarBrand>
          <div className="p-1">
            <FastForward size={24} />
          </div>
          <span className="text-small text-default-foreground ml-2 font-medium">
            Adderall
          </span>
        </NavbarBrand>

        <NavbarContent className="hidden md:flex" justify="end">
          <NavbarItem className="ml-2 flex! gap-2">
            {mounted && (
              <Button
                isIconOnly
                className="text-default-500"
                radius="full"
                variant="light"
                onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <SunIcon size={20} />
                ) : (
                  <MoonIcon size={20} />
                )}
              </Button>
            )}
            <Button
              className="bg-default-foreground text-background font-medium"
              color="secondary"
              radius="full"
              variant="flat"
              as={Link}
              href="/app"
              endContent={<ChevronRight size={16} />}
            >
              Get Started
            </Button>
          </NavbarItem>
        </NavbarContent>

        <NavbarMenuToggle className="text-default-400 md:hidden" />

        <NavbarMenu
          className="bg-default-200/50 shadow-medium dark:bg-default-100/50 top-[calc(var(--navbar-height)-1px)] max-h-fit pt-6 pb-6 backdrop-blur-md backdrop-saturate-150"
          motionProps={{
            initial: { opacity: 0, y: -20 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -20 },
            transition: {
              ease: "easeInOut",
              duration: 0.2,
            },
          }}
        >
          <NavbarMenuItem className="mb-4">
            <Button
              fullWidth
              as={Link}
              className="bg-foreground text-background"
              href="/app"
              endContent={<ChevronRight size={16} />}
            >
              Get Started
            </Button>
          </NavbarMenuItem>
          {menuItems.map((item) => (
            <NavbarMenuItem key={item}>
              <Link className="text-default-500 mb-2 w-full" href="#" size="md">
                {item}
              </Link>
            </NavbarMenuItem>
          ))}
        </NavbarMenu>
      </Navbar>
    );
  },
);

BasicNavbar.displayName = "BasicNavbar";

export default BasicNavbar;
