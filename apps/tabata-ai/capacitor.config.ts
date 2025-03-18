import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'tabata-ai',
  webDir: '../../dist/apps/tabata-ai',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
};

export default config;
