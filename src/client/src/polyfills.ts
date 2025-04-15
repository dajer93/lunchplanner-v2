// Polyfill for 'global' used by amazon-cognito-identity-js
if (typeof window !== 'undefined' && !(window as any).global) {
  (window as any).global = window;
}

// Add other browser polyfills if needed
if (typeof window !== 'undefined' && !(window as any).process) {
  (window as any).process = { env: {} };
} 