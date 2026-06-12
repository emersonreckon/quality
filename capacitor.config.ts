import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovable.snapstore',
  appName: 'Quality Control Production',
  webDir: 'dist',
  server: {
    cleartext: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    Camera: {
      permissions: ['camera'],
    },
    Filesystem: {
      permissions: ['publicStorage'],
    },
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
