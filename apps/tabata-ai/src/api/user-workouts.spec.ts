import { webcrypto } from 'node:crypto';

process.env['UPSTASH_URL'] = 'https://upstash.example';
process.env['UPSTASH_TOKEN'] = 'test-token';

Object.defineProperty(global, 'crypto', {
    value: webcrypto,
    configurable: true
});

class TestRequest {
    readonly method: string;
    readonly headers: Headers;
    private readonly body: string | undefined;

    constructor(
        readonly url: string,
        init?: { method?: string; body?: string; headers?: HeadersInit }
    ) {
        this.method = init?.method ?? 'GET';
        this.headers = new Headers(init?.headers);
        this.body = init?.body;
    }

    async json(): Promise<unknown> {
        return this.body ? JSON.parse(this.body) : null;
    }
}

class TestResponse {
    readonly ok: boolean;
    readonly status: number;

    constructor(
        private readonly body: string | null,
        init?: { status?: number }
    ) {
        this.status = init?.status ?? 200;
        this.ok = this.status >= 200 && this.status < 300;
    }

    async json(): Promise<unknown> {
        return this.body ? JSON.parse(this.body) : null;
    }
}

global.Request = TestRequest as unknown as typeof Request;
global.Response = TestResponse as unknown as typeof Response;

const handler = require('../../api/user-workouts').default as {
    fetch: (request: Request) => Promise<Response>;
};

describe('user-workouts API handler', () => {
    let fetchMock: jest.Mock;
    let keyPair: CryptoKeyPair;
    let publicJwk: JsonWebKey;

    beforeAll(async () => {
        keyPair = (await crypto.subtle.generateKey(
            {
                name: 'RSASSA-PKCS1-v1_5',
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256'
            },
            true,
            ['sign', 'verify']
        )) as CryptoKeyPair;
        publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
        publicJwk.kid = 'test-key';
        publicJwk.alg = 'RS256';
        publicJwk.use = 'sig';
    });

    beforeEach(() => {
        fetchMock = jest.fn();
        global.fetch = fetchMock;
    });

    it('rejects requests without a Firebase bearer token before touching Upstash', async () => {
        // Act
        const response = await handler.fetch(new Request('https://app.test/api/user-workouts/user-1'));

        // Assert
        expect(response.status).toBe(401);
        await expect(response.json()).resolves.toEqual({ error: 'Missing bearer token' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects a valid Firebase token for a different userId before touching Upstash', async () => {
        // Arrange
        fetchMock.mockResolvedValueOnce(jsonUpstashResponse({ keys: [publicJwk] }));

        // Act
        const response = await handler.fetch(
            new Request('https://app.test/api/user-workouts/victim-user', {
                headers: await authorizationHeaders('attacker-user')
            })
        );

        // Assert
        expect(response.status).toBe(403);
        await expect(response.json()).resolves.toEqual({ error: 'Authenticated user cannot access another user workout record' });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
    });

    it('stores PUT payloads in a per-user key instead of rewriting the shared legacy list', async () => {
        // Arrange
        const expectedRecord = {
            userId: 'user-1',
            favoriteWorkouts: ['w1'],
            workoutItems: [{ workoutId: 'w1', completed: true, startedAt: '2026-01-01', finishedAt: '2026-01-01' }]
        };
        fetchMock.mockResolvedValueOnce(jsonUpstashResponse({ keys: [publicJwk] })).mockResolvedValueOnce(jsonUpstashResponse({ result: 'OK' }));

        // Act
        const response = await handler.fetch(
            new Request('https://app.test/api/user-workouts/user-1', {
                method: 'PUT',
                headers: await authorizationHeaders('user-1'),
                body: JSON.stringify({ ...expectedRecord, userId: 'spoofed-user' })
            })
        );

        // Assert
        await expect(response.json()).resolves.toEqual(expectedRecord);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://upstash.example',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(['JSON.SET', 'user_workouts:user-1', '$', JSON.stringify(expectedRecord)])
            })
        );
    });

    it('falls back to the legacy shared list when a per-user key has not been migrated yet', async () => {
        // Arrange
        const legacyRecord = {
            userId: 'legacy-user',
            favoriteWorkouts: ['w1'],
            workoutItems: []
        };
        fetchMock
            .mockResolvedValueOnce(jsonUpstashResponse({ keys: [publicJwk] }))
            .mockResolvedValueOnce(jsonUpstashResponse({ result: null }))
            .mockResolvedValueOnce(jsonUpstashResponse({ result: JSON.stringify([legacyRecord]) }));

        // Act
        const response = await handler.fetch(
            new Request('https://app.test/api/user-workouts/legacy-user', { headers: await authorizationHeaders('legacy-user') })
        );

        // Assert
        await expect(response.json()).resolves.toEqual(legacyRecord);
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            'https://upstash.example',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(['JSON.GET', 'user_workouts:legacy-user'])
            })
        );
        expect(fetchMock).toHaveBeenNthCalledWith(3, 'https://upstash.example/JSON.GET/user_workouts', expect.any(Object));
    });

    it('deletes both the per-user key and any legacy shared-list entry', async () => {
        // Arrange
        fetchMock
            .mockResolvedValueOnce(jsonUpstashResponse({ keys: [publicJwk] }))
            .mockResolvedValueOnce(jsonUpstashResponse({ result: 1 }))
            .mockResolvedValueOnce(jsonUpstashResponse({ result: 1 }));

        // Act
        const response = await handler.fetch(
            new Request('https://app.test/api/user-workouts/delete-me', { method: 'DELETE', headers: await authorizationHeaders('delete-me') })
        );

        // Assert
        await expect(response.json()).resolves.toEqual({ success: true });
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            'https://upstash.example',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(['DEL', 'user_workouts:delete-me'])
            })
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            3,
            'https://upstash.example',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(['JSON.DEL', 'user_workouts', '$[?(@.userId=="delete-me")]'])
            })
        );
    });

    async function authorizationHeaders(userId: string): Promise<HeadersInit> {
        return {
            Authorization: `Bearer ${await createFirebaseToken(userId)}`
        };
    }

    async function createFirebaseToken(userId: string): Promise<string> {
        const header = encodeJson({ alg: 'RS256', kid: 'test-key', typ: 'JWT' });
        const now = Math.floor(Date.now() / 1000);
        const payload = encodeJson({
            aud: 'tabata-ai-player',
            exp: now + 3600,
            iat: now,
            iss: 'https://securetoken.google.com/tabata-ai-player',
            sub: userId,
            user_id: userId
        });
        const unsignedToken = `${header}.${payload}`;
        const signature = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, keyPair.privateKey, new TextEncoder().encode(unsignedToken));
        return `${unsignedToken}.${Buffer.from(new Uint8Array(signature)).toString('base64url')}`;
    }
});

function jsonUpstashResponse(body: unknown): Response {
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function encodeJson(value: unknown): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
}
