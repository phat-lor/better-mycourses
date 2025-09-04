"use client";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button isIconOnly radius="full" variant="light">
        <Icon className="text-default-500" icon="solar:sun-linear" width={24} />
      </Button>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button isIconOnly radius="full" variant="light" onPress={toggleTheme}>
      <Icon
        className="text-default-500"
        icon={theme === "dark" ? "solar:sun-linear" : "solar:moon-linear"}
        width={24}
      />
    </Button>
  );
}
