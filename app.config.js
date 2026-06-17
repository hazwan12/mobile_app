/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: 'Idle Tycoon',
    slug: 'idle-tycoon',
    owner: 'hazwan12',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',

    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#181825',
    },

    ios: {
      bundleIdentifier: 'com.hazwan12.idletycoon',
      googleServicesFile: './GoogleService-Info.plist',
      supportsTablet: false,
      buildNumber: '1',
      infoPlist: {
        // Required for ATT prompt (App Tracking Transparency)
        NSUserTrackingUsageDescription:
          'We use your ad identifier to show you relevant ads and measure their performance.',
        // AppLovin MAX SKAdNetwork identifiers — required for iOS 14+ ad attribution.
        // Full list: https://dash.applovin.com/documentation/mediation/ios/getting-started/skadnetwork
        SKAdNetworkItems: [
          { SKAdNetworkIdentifier: '4fzdc2evr5.skadnetwork' },
          { SKAdNetworkIdentifier: '4pfyvq9l8r.skadnetwork' },
          { SKAdNetworkIdentifier: '2fnua5tdw4.skadnetwork' },
          // Add the complete list from AppLovin dashboard before submitting to App Store
        ],
      },
    },

    android: {
      package: 'com.hazwan12.idletycoon',
      googleServicesFile: './google-services.json',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      permissions: [
        // AppLovin MAX / ad networks
        'com.google.android.gms.permission.AD_ID',
      ],
    },

    plugins: [
      'expo-dev-client',
      [
        'expo-tracking-transparency',
        {
          userTrackingPermission:
            'We use your ad identifier to show you relevant ads and measure their performance.',
        },
      ],
      '@react-native-firebase/app',
      '@react-native-firebase/analytics',
      [
        'react-native-google-mobile-ads',
        {
          // Get these from AdMob dashboard → App settings → App ID
          // Google's official test App IDs — replace with real ones from AdMob dashboard before release
          androidAppId: 'ca-app-pub-3940256099942544~3347511713',
          iosAppId:     'ca-app-pub-3940256099942544~1458002511',
        },
      ],
    ],

    "extra": {
      "eas": {
        "projectId": "8068f3d5-c398-46e2-a517-d29b0e6b76c2"
      }
    }
  },
};
