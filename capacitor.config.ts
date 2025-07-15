import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.restaurant.pos.system',
  appName: '餐廳管理系統',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#3b82f6",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff"
    },
    StatusBar: {
      style: "light",
      backgroundColor: "#3b82f6"
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true
    }
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#ffffff",
    webContentsDebuggingEnabled: true
  },
  android: {
    allowMixedContent: true,
    backgroundColor: "#ffffff",
    webContentsDebuggingEnabled: true
  }
};

export default config;
