import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "Better MyCourses",
    template: "%s | Better MyCourses",
  },
  description:
    "A modern, clean replacement for the MyCourses Moodle interface with enhanced usability and design. Transform your Moodle experience with clean interface, better navigation, and all the features you wish MyCourses had from the start.",
  keywords: [
    "MyCourses",
    "Moodle",
    "education",
    "learning management",
    "student portal",
    "university",
    "better interface",
    "modern design",
  ],
  authors: [{ name: "Better MyCourses Team" }],
  creator: "Better MyCourses",
  publisher: "Better MyCourses",
  metadataBase: new URL("https://github.com/phat-lor/better-mycourses"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://github.com/phat-lor/better-mycourses",
    title: "Better MyCourses - Modern Moodle Interface",
    description:
      "Transform your Moodle experience with clean interface, better navigation, and enhanced usability.",
    siteName: "Better MyCourses",
    images: [
      {
        url: "/light-thumbnail.png",
        width: 1200,
        height: 630,
        alt: "Better MyCourses - Modern Interface Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Better MyCourses - Modern Moodle Interface",
    description:
      "Transform your Moodle experience with clean interface, better navigation, and enhanced usability.",
    images: ["/light-thumbnail.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="text-foreground bg-background"
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
