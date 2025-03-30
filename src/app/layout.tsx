import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { ThemeProvider } from "~/components/themeProvider";
import { PostHogProvider } from "./providers";

export const metadata: Metadata = {
  title: "Schedule Bryan",
  description: "Never check dsb again",
  icons: [{ rel: "icon", url: "/paulsIcon.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} bg-neutral-900 text-neutral-400`}
      suppressHydrationWarning
    >
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>{children}</PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
