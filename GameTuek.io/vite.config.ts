import { defineConfig } from 'vite';

// Relative asset paths allow the standalone build to be served under /game/.
export default defineConfig({ base: './' });
