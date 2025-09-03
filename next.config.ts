import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ppr: false,
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mycourses.ict.mahidol.ac.th",
        port: "",
        pathname: "/pluginfile.php/**",
      },
    ],
  },
};

export default nextConfig;
