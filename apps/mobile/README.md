# Shram Sangam Mobile

Native Expo app for Android and iOS. The app is mobile-first and contains three modes in one product:

- Customer: request household services and see the 90/7/3 payment split.
- Worker Member: manage availability, review fair dispatch, and track earnings.
- Co-op Assembly: review proposals and cast votes.

From the repository root:

```bash
npm install
npm run mobile
```

Then scan the QR code with Expo Go, or press `a` in the Expo terminal to launch Android.

For a distributable Android APK, install EAS CLI and authenticate with your Expo account:

```bash
npx eas login
npx eas build --platform android --profile preview
```

The preview profile produces an installable APK. The package identifier is `com.shramsangam.app`.
