import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "LifeMeter",
  description:
    "A focused health companion for workouts, meals, sleep, and steady daily progress.",
};

const landingThemeScript = `
(() => {
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const applyTheme = (matches) => {
    root.dataset.landingTheme = matches ? "dark" : "light";
  };

  applyTheme(media.matches);

  const handleChange = (event) => {
    applyTheme(event.matches);
  };

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", handleChange);
  } else if (typeof media.addListener === "function") {
    media.addListener(handleChange);
  }
})();
`;

const chunkErrorScript = `
window.addEventListener("error", (event) => {
  if (event.message && event.message.includes("ChunkLoadError")) {
    const key = "lifemeter-chunk-reload";
    const lastReload = sessionStorage.getItem(key);
    const now = Date.now();

    // Only reload once every 10 seconds to avoid reload loops
    if (!lastReload || now - Number(lastReload) > 10000) {
      sessionStorage.setItem(key, String(now));
      window.location.reload();
    }
  }
}, true);
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className="dark"
      data-landing-theme="dark"
      data-theme="dark"
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <Script
          id="landing-theme-sync"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: landingThemeScript }}
        />
        <Script
          id="chunk-error-handler"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: chunkErrorScript }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background font-(--font-body) text-foreground antialiased"
      >
        {children}
      </body>
    </html>
  );
}
