import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { FloatingCopilot } from "@/components/copilot/floating-copilot";

export const metadata: Metadata = {
  title: "YuktiOS | Strategic Engineering Operating System",
  description:
    "A precision student operating system for engineering students in Karnataka.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <FloatingCopilot />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
