"use client";

import { getAnalytics, isSupported } from "firebase/analytics";
import { useEffect } from "react";
import { getFirebaseApp } from "@/lib/firebase-client";

/** Google Analytics (Firebase) — só inicializa no browser quando suportado. */
export function FirebaseAnalytics() {
  useEffect(() => {
    void isSupported().then((ok) => {
      if (ok) getAnalytics(getFirebaseApp());
    });
  }, []);
  return null;
}
