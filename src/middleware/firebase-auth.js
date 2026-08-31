import { verifyFirebaseIdToken } from "../services/firebase-admin.js";

function publicIdentity(decodedToken) {
  const name =
    typeof decodedToken.name === "string" && decodedToken.name.trim()
      ? decodedToken.name.trim().replace(/\s+/g, " ").slice(0, 80)
      : "Story Hub reader";
  const picture =
    typeof decodedToken.picture === "string"
      ? decodedToken.picture.trim().slice(0, 2_048)
      : "";
  return { uid: decodedToken.uid, name, picture };
}

async function authenticateFirebaseUser(req, res, next, required) {
  const authorization = req.get("authorization") || "";
  if (!authorization && !required) return next();
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({
      code: "auth/missing-token",
      error: "Sign in is required to rate or comment.",
    });
  }

  try {
    const decodedToken = await verifyFirebaseIdToken(match[1].trim());
    req.communityUser = publicIdentity(decodedToken);
    next();
  } catch (error) {
    if (error?.code === "firebase/configuration") return next(error);
    return res.status(401).json({
      code: "auth/invalid-token",
      error: "Your sign-in has expired. Please sign in again.",
    });
  }
}

export async function requireFirebaseUser(req, res, next) {
  return authenticateFirebaseUser(req, res, next, true);
}

export async function optionalFirebaseUser(req, res, next) {
  return authenticateFirebaseUser(req, res, next, false);
}
