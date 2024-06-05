import type { Metadata } from "next";
import { cn } from "@/lib/utils";

import "./globals.css";

export const metadata: Metadata = {
  title: "在线变装",
  description: "纯前端实现在线变装、头发换色、口红换色",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("font-IBMPlex antialiased")}>
        {children}
      </body>
    </html>
  );
}
