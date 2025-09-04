"use client";

import { Card } from "@heroui/react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function AppScreenshot() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="w-full h-[600px] bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-primary/40 rounded-full"></div>
          </div>
          <div className="max-w-sm">
            <h3 className="text-lg font-semibold mb-2">Loading Preview...</h3>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[600px] overflow-hidden p-0">
      <Image
        src={theme === "dark" ? "/dark-thumbnail.png" : "/light-thumbnail.png"}
        alt="Adderall app preview"
        fill
        className="object-cover object-top"
        priority
      />
    </Card>
  );
}
