import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Vader AI',
  description: 'Lord Vader, your AI assistant is at your command.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 