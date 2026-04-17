import type { Metadata } from "next";
import { Roboto, Poppins } from "next/font/google";
import { AppFooter } from "@/components/AppFooter";
import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

const poppins = Poppins({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Split Together",
  description: "Gift coordination for families and close friends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-app-text" style={{ backgroundColor: "#FDFBF8" }}>
        <div className="flex-1">{children}</div>
        <AppFooter />
      </body>
    </html>
  );
}
