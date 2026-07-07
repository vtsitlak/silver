const FIREBASE_PROJECT_ID = process.env['FIREBASE_PROJECT_ID'] ?? 'tabata-ai-player';
const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

interface FirebaseJwtHeader {
    alg?: string;
    kid?: string;
}

interface FirebaseJwtPayload {
    aud?: string;
    exp?: number;
    iss?: string;
    sub?: string;
    user_id?: string;
}

interface FirebaseJwksResponse {
    keys?: JsonWebKey[];
}

export class AuthError extends Error {
    constructor(
        message: string,
        readonly status: number = 401
    ) {
        super(message);
    }
}

function decodeBase64Url(input: string): Uint8Array {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    if (typeof atob === 'function') {
        const binary = atob(padded);
        return Uint8Array.from(binary, (char) => char.charCodeAt(0));
    }
    return Uint8Array.from(Buffer.from(padded, 'base64'));
}

function decodeJwtPart<T>(input: string): T {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(input))) as T;
}

async function fetchFirebasePublicKeys(): Promise<JsonWebKey[]> {
    const response = await fetch(FIREBASE_JWKS_URL);
    const data = (await response.json()) as FirebaseJwksResponse;
    if (!response.ok) {
        throw new AuthError('Unable to verify bearer token');
    }
    return data.keys ?? [];
}

async function verifyFirebaseIdToken(token: string): Promise<string> {
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new AuthError('Invalid bearer token');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts as [string, string, string];
    const header = decodeJwtPart<FirebaseJwtHeader>(encodedHeader);
    if (header.alg !== 'RS256' || !header.kid) {
        throw new AuthError('Invalid bearer token');
    }

    const publicKeys = await fetchFirebasePublicKeys();
    const publicKey = publicKeys.find((key) => key.kid === header.kid && key.alg === 'RS256');
    if (!publicKey) {
        throw new AuthError('Invalid bearer token');
    }

    const key = await crypto.subtle.importKey('jwk', publicKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const signature = decodeBase64Url(encodedSignature);
    const signedData = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
    const isValid = await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, signature, signedData);
    if (!isValid) {
        throw new AuthError('Invalid bearer token');
    }

    const payload = decodeJwtPart<FirebaseJwtPayload>(encodedPayload);
    const now = Math.floor(Date.now() / 1000);
    const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
    const uid = payload.user_id ?? payload.sub;
    if (payload.aud !== FIREBASE_PROJECT_ID || payload.iss !== expectedIssuer || !uid || payload.exp === undefined || payload.exp <= now) {
        throw new AuthError('Invalid bearer token');
    }

    return uid;
}

export async function requireAuthenticatedUserId(request: Request): Promise<string> {
    const authorization = request.headers.get('Authorization');
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        throw new AuthError('Missing bearer token');
    }
    return verifyFirebaseIdToken(match[1]!);
}

export async function getAuthenticatedUserId(request: Request): Promise<string | null> {
    const authorization = request.headers.get('Authorization');
    if (!authorization) {
        return null;
    }

    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        throw new AuthError('Invalid bearer token');
    }

    return verifyFirebaseIdToken(match[1]!);
}
