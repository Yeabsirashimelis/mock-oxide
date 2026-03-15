import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mock API Playground",
  description: "Build mock REST APIs without writing code. Define your schema, get instant endpoints with realistic data for testing and development.",
  keywords: ["mock api", "rest api", "fake api", "api testing", "mock data", "api playground"],
  authors: [{ name: "Mock API Playground" }],
  openGraph: {
    title: "Mock API Playground",
    description: "Build mock REST APIs in seconds",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
