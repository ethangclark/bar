import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import {
  SignJWT,
  generateKeyPair,
  exportJWK,
  exportSPKI,
  importJWK,
  type JWK,
} from "jose";
import { assertIsError } from "~/common/utils/errorUtils";

/**
 * Caches a jwksClient per issuer so we don't re-instantiate repeatedly.
 */
const issuerToJwksClientMap = new Map<string, jwksClient.JwksClient>();

/**
 * Return a jwks-rsa client for the given JWKS URL.
 */
function getJwksClient(jwksUri: string) {
  const client = issuerToJwksClientMap.get(jwksUri) ?? jwksClient({ jwksUri });
  issuerToJwksClientMap.set(jwksUri, client);
  return client;
}

/**
 * Retrieve the LMS’s public key (PEM) to verify an id_token.
 * We do this by examining the `kid` (Key ID) in the JWT header,
 * then fetching that key from the LMS’s JWKS endpoint.
 */
async function getSigningKey(jwksUri: string, kid: string) {
  const client = getJwksClient(jwksUri);
  const key = await client.getSigningKey(kid);
  return key.getPublicKey(); // PEM-format public key
}

/**
 * Validate the LTI 1.3 id_token from the LMS.
 * Checks signature via JWKS, issuer, audience, etc.
 */
export async function validateLtiIdToken({
  idToken,
  expectedIssuer,
  expectedAudience,
  jwksUrl,
}: {
  idToken: string;
  expectedIssuer: string;
  expectedAudience: string;
  jwksUrl: string;
}) {
  if (!idToken) throw new Error("Missing id_token");

  // Decode header to get "kid"
  const decodedHeader = jwt.decode(idToken, { complete: true });
  if (!decodedHeader?.header) {
    throw new Error("Invalid JWT header");
  }
  const { kid } = decodedHeader.header;
  if (!kid) {
    throw new Error('No "kid" found in JWT header');
  }

  // Retrieve the PEM public key from JWKS
  const publicKey = await getSigningKey(jwksUrl, kid);

  // Verify signature and claims
  let verifiedToken;
  try {
    verifiedToken = jwt.verify(idToken, publicKey, {
      algorithms: ["RS256"], // LTI 1.3 typically uses RS256
      issuer: expectedIssuer,
      audience: expectedAudience,
    });
  } catch (err) {
    assertIsError(err);
    throw new Error("JWT Verification failed: " + err.message);
  }

  return verifiedToken;
}

/**
 * In some LTI 1.3 flows, the Tool needs to call the LMS’s service endpoints
 * (e.g. to pass back grades). Tools typically must sign an OAuth2 client_assertion
 * with a private key.
 *
 * This function signs a JWT for that purpose.
 */
export async function signClientAssertion({
  issuer,
  audience,
  privateKeyObj,
}: {
  issuer: string;
  audience: string;
  privateKeyObj: JWK; // JWK format private key
}) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 300; // 5 minutes

  const payload = {
    iss: issuer,
    sub: issuer,
    aud: audience,
    iat,
    exp,
    jti: Math.random().toString(36).substring(2),
  };

  // Use `SignJWT` from `jose` to sign the JWT
  const privateKey = await importJWK(privateKeyObj, "RS256");
  const signedJwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256" })
    .sign(privateKey);

  return signedJwt;
}

/**
 * Example: generate or load your own private key for signing.
 * Real usage: store a stable key in your DB or environment variables.
 * This function demonstrates generating a new one each time (not recommended in production).
 */
let cachedToolPrivateKey: JWK | null = null;
let cachedToolPublicKeyPem: string | null = null;

export async function getOrCreateToolKeyPair() {
  if (cachedToolPrivateKey && cachedToolPublicKeyPem) {
    return {
      privateKey: cachedToolPrivateKey,
      publicKeyPem: cachedToolPublicKeyPem,
    };
  }

  // Generate a 2048-bit RSA key (for demonstration only).
  // In production, you might read from a file, env var, or store in secure vault.
  const { privateKey, publicKey } = await generateKeyPair("RS256", {
    modulusLength: 2048,
  });
  const privateJwk = await exportJWK(privateKey);
  const publicPem = await exportSPKI(publicKey); // Export public key in PEM format

  cachedToolPrivateKey = privateJwk;
  cachedToolPublicKeyPem = publicPem;

  return {
    privateKey: cachedToolPrivateKey,
    publicKeyPem: cachedToolPublicKeyPem,
  };
}

// /************************************************************************************************
//  *  B. Example In-Memory State for OIDC
//  *  We store ephemeral state/nonce for demonstration.
//  *  In production, store in a DB or encrypted session cookie.
//  ***********************************************************************************************/
// const OIDC_STATE_CACHE = new Map();
