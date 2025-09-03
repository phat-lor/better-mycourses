"use client";

import { domAnimation, LazyMotion, m, useAnimation } from "framer-motion";
import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

const animationVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const FadeInImage = (props: ImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const animationControls = useAnimation();

  useEffect(() => {
    if (isLoaded) {
      animationControls.start("visible");
    }
  }, [isLoaded, animationControls]);

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        animate={animationControls}
        initial="hidden"
        transition={{ duration: 0.5, ease: "easeOut" }}
        variants={animationVariants}
      >
        <Image
          {...props}
          alt={props.alt || "Background image"}
          onLoad={() => setIsLoaded(true)}
        />
      </m.div>
    </LazyMotion>
  );
};

export default FadeInImage;
