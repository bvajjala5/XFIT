import { Capacitor } from '@capacitor/core'

/**
 * True when the app is running inside the native Capacitor WebView. The public
 * website keeps its landing page and popup sign-in; only the packaged app gets
 * the login-first flow and the Firebase redirect handoff.
 */
export const isNativeApp = () => Capacitor.isNativePlatform()
