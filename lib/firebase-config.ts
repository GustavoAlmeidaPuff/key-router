/** Config pública do Firebase (apiKey é segura para expor no cliente). */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyDAe0JAb9vaP1y12s4L4N5VW-TgcguXziA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "key-router.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "key-router",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "key-router.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "10244551694",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:10244551694:web:b1c7f8b396c693dfb1b85f",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-CGFCQMZMF0",
} as const;
