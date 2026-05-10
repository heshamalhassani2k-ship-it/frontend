/**
 * HTML Root - Web configuration
 * Handles web-specific setup and scroll behavior
 */

// @ts-nocheck
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ar" dir="rtl" style={{ height: '100%' }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="description" content="تطبيق إدارة المالية والديون" />
        <meta name="theme-color" content="#020617" />

        {/* Disable scroll on body to make ScrollView work properly */}
        <ScrollViewStyleReset />

        {/* Web-specific styles */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Fix React Native Web rendering */
              body > div:first-child {
                position: fixed !important;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
              }

              /* Fix accessibility issues */
              [role="tablist"] [role="tab"] * {
                overflow: visible !important;
              }
              [role="heading"],
              [role="heading"] * {
                overflow: visible !important;
              }

              /* RTL text direction */
              body {
                direction: rtl;
                text-align: right;
              }

              /* Smooth scrolling */
              html {
                scroll-behavior: smooth;
              }

              /* Better font rendering */
              * {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
            `,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          direction: 'rtl',
          textAlign: 'right',
        }}
      >
        {children}
      </body>
    </html>
  );
}
