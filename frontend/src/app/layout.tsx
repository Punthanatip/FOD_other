import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { InputProvider } from "../context/input-context";
import Link from 'next/link';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FOD Detection System",
  description: "Foreign Object Debris Detection System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white`}
      >
        <InputProvider>
          {/* Navigation Bar */}
          <nav className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="container mx-auto flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-white">FOD</span>
                </div>
                <h1 className="text-xl font-bold">FOD Detection System</h1>
              </div>
              <div className="flex space-x-4">
                <Link href="/input" className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
                  Input & Control
                </Link>
                <Link href="/monitoring" className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
                  Monitoring
                </Link>
                <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
                  Dashboard
                </Link>
              </div>
            </div>
          </nav>
          <div className="h-[calc(100vh-80px)]">
            {children}
          </div>
        </InputProvider>
      </body>
    </html>
  );
}
