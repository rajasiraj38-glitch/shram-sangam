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

## Build APK with GitHub Actions

Add an `EXPO_TOKEN` repository secret in GitHub. Create it from your Expo account with `eas token:create`, then run the **Build Shram Sangam Android APK** workflow from the Actions tab. The workflow uploads the APK as an Actions artifact. When triggered by a tag matching `v*-mobile`, it also attaches the APK to the GitHub release.
