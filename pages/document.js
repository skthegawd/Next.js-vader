import { Html, Head, Main, NextScript } from 'next/document';
import { Component } from 'react';

class MyDocument extends Component {
    render() {
        return (
            <Html>
                <Head>
                    {/* Add any meta tags, fonts, or scripts here */}
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}

export default MyDocument;

