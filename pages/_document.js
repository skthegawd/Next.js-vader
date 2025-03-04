import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Ensuring proper encoding and viewport settings */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Force correct Content-Type to avoid unexpected token '<' errors */}
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />

        {/* Ensure critical scripts are loaded properly */}
        <Script src="/_next/static/chunks/polyfills.js" strategy="beforeInteractive" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}