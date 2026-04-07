import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes"
import "./globals.css";

export const metadata: Metadata = {
  title: "LandingLab — Crea landing pages para tu infoproducto",
  description:
    "Transforma tu producto digital en una landing page profesional lista para Shopify. Sin saber copywriting, sin tocar código.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <ClerkProvider
          appearance={{
            theme: dark,
          }}
          signInForceRedirectUrl="/dashboard"
          signUpForceRedirectUrl="/dashboard"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}

