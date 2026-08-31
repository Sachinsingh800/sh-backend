import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "../config/env.js";

const APP_NAME = "story-hub-api";

function firebaseOptions() {
  if (!env.firebaseProjectId) {
    const error = new Error("FIREBASE_PROJECT_ID is not configured.");
    error.code = "firebase/configuration";
    error.status = 503;
    throw error;
  }

  const hasClientEmail = Boolean(env.firebaseClientEmail);
  const hasPrivateKey = Boolean(env.firebasePrivateKey);
  if (hasClientEmail !== hasPrivateKey) {
    const error = new Error(
      "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be configured together.",
    );
    error.code = "firebase/configuration";
    error.status = 503;
    throw error;
  }

  const options = { projectId: env.firebaseProjectId };
  if (hasClientEmail && hasPrivateKey) {
    options.credential = cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey,
    });
  }
  return options;
}

function getFirebaseApp() {
  const existing = getApps().find((app) => app.name === APP_NAME);
  return existing || initializeApp(firebaseOptions(), APP_NAME);
}

export async function verifyFirebaseIdToken(idToken) {
  return getAuth(getFirebaseApp()).verifyIdToken(idToken);
}
