import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'io.ionic.starter',
    appName: 'tabata-ai',
    webDir: '../../dist/apps/tabata-ai',
    server: {
        androidScheme: 'https',
        cleartext: true
    },
    android: {
        allowMixedContent: true
    },
    ios: {
        contentInset: 'automatic'
    }
};

export default config;
