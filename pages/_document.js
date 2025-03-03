import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Ensure proper encoding and viewport settings */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Force correct content-type */}
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />

        {/* Preload critical scripts properly */}
        <script
          src="/_next/static/chunks/polyfills.js"
          strategy="beforeInteractive"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}