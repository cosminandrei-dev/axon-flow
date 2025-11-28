import * as jose from 'jose';

let cachedPrivateKey: jose.KeyLike | null = null;
let cachedPublicKey: jose.KeyLike | null = null;

/**
 * Loads the private key from environment variable AUTH_PRIVATE_KEY.
 * In development, auto-generates a keypair if not provided.
 */
export async function loadPrivateKey(): Promise<jose.KeyLike> {
  if (cachedPrivateKey) {
    return cachedPrivateKey;
  }

  const privateKeyEnv = process.env.AUTH_PRIVATE_KEY;

  if (privateKeyEnv) {
    // Decode from base64 and import as PEM
    const privateKeyPem = Buffer.from(privateKeyEnv, 'base64').toString('utf-8');
    cachedPrivateKey = await jose.importPKCS8(privateKeyPem, 'RS256');
    return cachedPrivateKey;
  }

  // Development: Auto-generate keypair
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '⚠️  AUTH_PRIVATE_KEY not set. Generating development keypair. DO NOT use in production!',
    );
    const { privateKey, publicKey } = await generateKeypair();
    cachedPrivateKey = privateKey;
    cachedPublicKey = publicKey;
    return cachedPrivateKey;
  }

  throw new Error('AUTH_PRIVATE_KEY environment variable is required in production');
}

/**
 * Loads the public key from environment variable AUTH_PUBLIC_KEY.
 * In development, auto-generates a keypair if not provided.
 */
export async function loadPublicKey(): Promise<jose.KeyLike> {
  if (cachedPublicKey) {
    return cachedPublicKey;
  }

  const publicKeyEnv = process.env.AUTH_PUBLIC_KEY;

  if (publicKeyEnv) {
    // Decode from base64 and import as PEM
    const publicKeyPem = Buffer.from(publicKeyEnv, 'base64').toString('utf-8');
    cachedPublicKey = await jose.importSPKI(publicKeyPem, 'RS256');
    return cachedPublicKey;
  }

  // Development: Auto-generate keypair if private key also missing
  if (process.env.NODE_ENV !== 'production') {
    // Trigger private key generation which also caches public key
    await loadPrivateKey();
    if (cachedPublicKey) {
      return cachedPublicKey;
    }
  }

  throw new Error('AUTH_PUBLIC_KEY environment variable is required in production');
}

/**
 * Generates an RS256 keypair for development use.
 * @internal
 */
async function generateKeypair(): Promise<{
  privateKey: jose.KeyLike;
  publicKey: jose.KeyLike;
}> {
  const { privateKey, publicKey } = await jose.generateKeyPair('RS256', {
    modulusLength: 2048,
  });
  return { privateKey, publicKey };
}

/**
 * Clears the cached keys. Useful for testing.
 * @internal
 */
export function clearKeyCache(): void {
  cachedPrivateKey = null;
  cachedPublicKey = null;
}
