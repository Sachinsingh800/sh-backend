import ImageKit, { toFile } from "@imagekit/nodejs";
import { env } from "../config/env.js";

let client;

function imagekit() {
  if (!env.imagekitPrivateKey) {
    const error = new Error(
      "IMAGEKIT_PRIVATE_KEY is required for uploads. Add it only to backend/.env.",
    );
    error.status = 503;
    throw error;
  }
  client ??= new ImageKit({ privateKey: env.imagekitPrivateKey });
  return client;
}

export async function uploadBuffer(buffer, fileName, folder = "/story-hub") {
  const response = await imagekit().files.upload({
    file: await toFile(buffer, fileName),
    fileName,
    folder,
    useUniqueFileName: true,
  });
  return {
    fileId: response.fileId,
    name: response.name,
    url: response.url,
    thumbnailUrl: response.thumbnailUrl,
    height: response.height,
    width: response.width,
    size: response.size,
    fileType: response.fileType,
  };
}

export function uploadAuthentication() {
  if (!env.imagekitPublicKey) {
    const error = new Error("IMAGEKIT_PUBLIC_KEY is not configured.");
    error.status = 503;
    throw error;
  }
  return {
    ...imagekit().helper.getAuthenticationParameters(),
    publicKey: env.imagekitPublicKey,
    urlEndpoint: env.imagekitUrlEndpoint,
  };
}
