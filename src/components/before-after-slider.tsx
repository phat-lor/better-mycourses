"use client";

import ReactBeforeSliderComponent from "react-before-after-slider-component";
import "react-before-after-slider-component/dist/build.css";

export default function BeforeAfterSlider() {
  const FIRST_IMAGE = {
    imageUrl: "/mycourses-mu.png",
    alt: "MyCourses - Original Interface",
  };

  const SECOND_IMAGE = {
    imageUrl: "/mycourses-addy.png",
    alt: "Adderall - Modern Interface",
  };

  return (
    <ReactBeforeSliderComponent
      firstImage={FIRST_IMAGE}
      secondImage={SECOND_IMAGE}
    />
  );
}
