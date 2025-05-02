import React from 'react';
import Head from 'next/head';
import { VoiceAssistant } from '../components/VoiceAssistant';

export default function ChatPage() {
  return (
    <>
      <Head>
        <title>AI Chat Assistant</title>
        <meta name="description" content="Chat with your AI assistant" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <div className="container">
          <h1>AI Chat Assistant</h1>
          <VoiceAssistant />
        </div>

        <style jsx>{`
          .container {
            min-height: 100vh;
            padding: 2rem;
            background: #121212;
            color: white;
          }

          h1 {
            text-align: center;
            margin-bottom: 2rem;
            color: #2962ff;
          }
        `}</style>

        <style jsx global>{`
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
              Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background: #121212;
            color: white;
          }
        `}</style>
      </main>
    </>
  );
} 