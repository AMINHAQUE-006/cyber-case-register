import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल | National Cyber Crime Reporting Portal",
  description: "Indian Government official portal for registering, tracking and managing cyber crime cases. Report cyber crimes online securely.",
  keywords: "cyber crime, report cyber crime, India, government, online fraud, case tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
