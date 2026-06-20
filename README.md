# Card2Contact

React Native mobile app for scanning business cards and extracting contact information using AI.

## Features

- **Camera Scanning**: Take photos of business cards using native camera
- **AI Extraction**: Uses Agnes AI API to extract contact details from card images
- **Local Storage**: Saves contacts locally using AsyncStorage
- **Contact Management**: View, edit, and delete saved contacts
- **CSV Export**: Export all contacts to CSV file for sharing

## Tech Stack

- React Native CLI (0.86.0)
- TypeScript
- react-native-vision-camera (camera)
- @react-native-async-storage/async-storage (local storage)
- react-native-fs (file system)
- react-native-share (CSV sharing)
- react-native-paper (UI components)
- @react-navigation/native-stack (navigation)

## Setup

### Prerequisites

- Node.js 18+
- Android Studio + Android SDK
- JDK 17

### Installation

```bash
# Clone/navigate to project
cd Card2Contact

# Install dependencies
npm install

# Install Android dependencies
cd android && ./gradlew clean && cd ..

# Start Metro bundler
npx react-native start

# Run on Android (separate terminal)
npx react-native run-android
```

## Building APK

```bash
cd android

# Debug APK
./gradlew assembleDebug

# Release APK (requires signing config)
./gradlew assembleRelease
```

APK output: `android/app/build/outputs/apk/`

## Project Structure

```
Card2Contact/
├── App.tsx                    # Entry point
├── src/
│   ├── components/            # Reusable UI components
│   ├── screens/               # App screens
│   │   ├── CameraScreen.tsx   # Camera + capture
│   │   ├── ContactsScreen.tsx # Contact list + search + export
│   │   ├── ContactDetailScreen.tsx # View/edit contact
│   │   └── ProcessingScreen.tsx    # AI extraction + review
│   ├── services/
│   │   ├── ContactContext.tsx # Contact state management
│   │   ├── aiService.ts     # Agnes AI API calls
│   │   └── theme.ts         # App theme
│   └── types/
│       └── index.ts         # TypeScript types
├── android/                   # Android project
└── package.json
```

## Agnes AI API

The app uses Agnes AI for business card OCR:
- Model: `agnes-1.5-flash`
- Endpoint: `https://apihub.agnes-ai.com/v1/chat/completions`
- API key is embedded in `src/services/aiService.ts`

## Data Model

```typescript
interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  imageUri?: string;
  createdAt: number;
  updatedAt: number;
}
```

## License

Personal use only - JPMoreGain Project
