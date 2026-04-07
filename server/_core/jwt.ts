import { jwtVerify, SignJWT } from "jose";
import { ENV } from "./env";
import { ONE_YEAR_MS } from "@shared/const";

function getSessionSecret() {
  const secret = ENV.cookieSecret || 'default_secret_key_12345';
  return new TextEncoder().encode(secret);
}

export async function signSession(
  payload: { email: string; name?: string | null },
  options: { expiresInMs?: number } = {}
): Promise<string> {
  const issuedAt = Date.now();
  const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
  const secretKey = getSessionSecret();

  return new SignJWT({
    email: payload.email,
    name: payload.name || "",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

export async function verifySession(
  token: string
): Promise<{ email: string; name: string } | null> {
  try {
    const secretKey = getSessionSecret();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });
    
    if (typeof payload.email !== "string") {
      return null;
    }

    return {
      email: payload.email,
      name: (payload.name as string) || "",
    };
  } catch (error) {
    return null;
  }
}
