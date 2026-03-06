import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SlideX AI",
  description: "Beautiful presentations from a single prompt",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="fixed left-2 top-2 z-[100] -translate-y-16 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <Providers>
          <div id="main-content">{children}</div>
          <Toaster richColors position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
