import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let app: App | undefined;

export function getAdminApp(): App {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "Defina FIREBASE_SERVICE_ACCOUNT_JSON com o JSON da conta de serviço (Firebase Console → Configurações do projeto → Contas de serviço → Gerar nova chave privada).",
    );
  }
  const cred = JSON.parse(raw) as Parameters<typeof cert>[0];
  app = initializeApp({ credential: cert(cred) });
  return app;
}

export function firestoreDb() {
  return getFirestore(getAdminApp());
}

export function firebaseAdminAuth() {
  return getAuth(getAdminApp());
}
