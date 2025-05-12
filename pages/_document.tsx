import { Html, Head, Main, NextScript } from "next/document";
import type { DocumentProps } from "next/document";

export default function Document(props: DocumentProps) {
  return (
    <Html lang="en">
      <Head>
        {/* Ensure proper encoding and viewport settings */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />

        {/* iOS specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Vader Chat" />
        <meta name="theme-color" content="#000000" />

        {/* PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Vader Chat" />
        <meta name="format-detection" content="telephone=no" />

        {/* Prevent text size adjustment */}
        <meta name="text-size-adjust" content="100%" />
        <meta name="-webkit-text-size-adjust" content="100%" />

        {/* Correct Content-Type to avoid syntax errors */}
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />

        {/* Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 