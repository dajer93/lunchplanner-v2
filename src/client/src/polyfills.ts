// Polyfill for 'global' used by amazon-cognito-identity-js
if (typeof window !== 'undefined' && !window.global) {
  (window as any).global = window;
}

// Add other browser polyfills if needed
if (typeof window !== 'undefined' && !window.process) {
  (window as any).process = { env: {} };
} 