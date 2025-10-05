import type { Metadata } from "next";
import { Hind_Vadodara } from "next/font/google";
import "../styles/globals.css";

const hindVadodara = Hind_Vadodara({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: '--font-hind',
});

export const metadata: Metadata = {
  title: "Whalli - Project Management",
  description: "A modern AI-powered project management platform with Deep Ocean theme",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={hindVadodara.variable}>
      <body className="font-hind antialiased">{children}</body>
    </html>
  );
}