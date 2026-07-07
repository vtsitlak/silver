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

interface WorkoutsHandler {
    fetch: (request: Request) => Promise<Response>;
}

const handlers: { name: string; handler: WorkoutsHandler }[] = [
    { name: 'app-local handler', handler: require('../../api/workouts').default as WorkoutsHandler },
    // Root Vercel entrypoints re-export the app handler; loaded here to verify deployment wiring.
    // eslint-disable-next-line @nx/enforce-module-boundaries -- integration test for root API re-export
    { name: 'root handler', handler: require('../../../../api/workouts').default as WorkoutsHandler },
    // eslint-disable-next-line @nx/enforce-module-boundaries -- integration test for root API re-export
    { name: 'root dynamic handler', handler: require('../../../../api/workouts/[id]').default as WorkoutsHandler }
];

const collectionHandlers = handlers.filter(({ name }) => name !== 'root dynamic handler');

describe.each(handlers)('workouts API $name', ({ handler }) => {
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

    it('returns ownerless legacy workout details to anonymous readers', async () => {
        const legacyWorkout = { id: 'legacy-workout', name: 'Legacy public workout' };
        fetchMock.mockResolvedValueOnce(jsonUpstashResponse({ result: JSON.stringify([legacyWorkout]) }));

        const response = await handler.fetch(new Request('https://app.test/api/workouts/legacy-workout'));

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual(legacyWorkout);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://upstash.example/JSON.GET/tabata_workouts', expect.any(Object));
    });

    it('hides owner-stamped workouts from unauthenticated single-workout reads', async () => {
        fetchMock.mockResolvedValueOnce(
            jsonUpstashResponse({ result: JSON.stringify([{ id: 'workout-1', name: 'Private workout', createdByUserId: 'owner-user' }]) })
        );

        const response = await handler.fetch(new Request('https://app.test/api/workouts/workout-1'));

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toBeNull();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://upstash.example/JSON.GET/tabata_workouts', expect.any(Object));
    });

    it('returns owner-stamped workouts to their authenticated owner on single-workout reads', async () => {
        const workout = { id: 'workout-1', name: 'Private workout', createdByUserId: 'owner-user' };
        fetchMock
            .mockResolvedValueOnce(jsonUpstashResponse({ keys: [publicJwk] }))
            .mockResolvedValueOnce(jsonUpstashResponse({ result: JSON.stringify([workout]) }));

        const response = await handler.fetch(new Request('https://app.test/api/workouts/workout-1', { headers: await authorizationHeaders('owner-user') }));

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual(workout);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://upstash.example/JSON.GET/tabata_workouts', expect.any(Object));
    });

    it('rejects read requests with invalid bearer tokens before touching Upstash', async () => {
        const response = await handler.fetch(new Request('https://app.test/api/workouts/workout-1', { headers: { Authorization: 'Bearer invalid-token' } }));

        expect(response.status).toBe(401);
        await expect(response.json()).resolves.toEqual({ error: 'Invalid bearer token' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects mutation requests without a Firebase bearer token before touching Upstash', async () => {
        const response = await handler.fetch(new Request('https://app.test/api/workouts/workout-1', { method: 'DELETE' }));

        expect(response.status).toBe(401);
        await expect(response.json()).resolves.toEqual({ error: 'Missing bearer token' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects updates from a user who did not create the workout', async () => {
        fetchMock
            .mockResolvedValueOnce(jsonUpstashResponse({ keys: [publicJwk] }))
            .mockResolvedValueOnce(
                jsonUpstashResponse({ result: JSON.stringify([{ id: 'workout-1', name: 'Victim workout', createdByUserId: 'owner-user' }]) })
            );

        const response = await handler.fetch(
            new Request('https://app.test/api/workouts/workout-1', {
                method: 'PUT',
                headers: await authorizationHeaders('attacker-user'),
                body: JSON.stringify({ name: 'Hijacked workout' })
            })
        );

        expect(response.status).toBe(403);
        await expect(response.json()).resolves.toEqual({ error: 'Authenticated user cannot mutate another user workout' });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://upstash.example/JSON.GET/tabata_workouts', expect.any(Object));
    });

    it('deletes a workout with a filtered JSON.DEL instead of rewriting the shared list', async () => {
        const existingWorkout = { id: 'workout-1', name: 'Old name', createdByUserId: 'owner-user' };
        fetchMock
            .mockResolvedValueOnce(jsonUpstashResponse({ keys: [publicJwk] }))
            .mockResolvedValueOnce(jsonUpstashResponse({ result: JSON.stringify([existingWorkout]) }))
            .mockResolvedValueOnce(jsonUpstashResponse({ result: 1 }));

        const response = await handler.fetch(
            new Request('https://app.test/api/workouts/workout-1', { method: 'DELETE', headers: await authorizationHeaders('owner-user') })
        );

        await expect(response.json()).resolves.toEqual({ success: true });
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://upstash.example/JSON.GET/tabata_workouts', expect.any(Object));
        expect(fetchMock).toHaveBeenNthCalledWith(
            3,
            'https://upstash.example',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(['JSON.DEL', 'tabata_workouts', '$[?(@.id=="workout-1")]'])
            })
        );
    });

    it('rejects attempts to delete another user workout before mutating Upstash', async () => {
        fetchMock
            .mockResolvedValueOnce(jsonUpstashResponse({ keys: [publicJwk] }))
            .mockResolvedValueOnce(jsonUpstashResponse({ result: JSON.stringify([{ id: 'workout-1', createdByUserId: 'owner-user' }]) }));

        const response = await handler.fetch(
            new Request('https://app.test/api/workouts/workout-1', { method: 'DELETE', headers: await authorizationHeaders('attacker-user') })
        );

        expect(response.status).toBe(403);
        await expect(response.json()).resolves.toEqual({ error: 'Authenticated user cannot mutate another user workout' });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('updates only the matching workout element instead of writing a stale full-array snapshot', async () => {
        const existingWorkout = {
            id: 'workout-1',
            name: 'Old name',
            createdAt: '2026-01-01-00:00:00',
            createdByUserId: 'owner-user',
            updatedByUserId: 'owner-user',
            updatedAt: 'old'
        };
        fetchMock
            .mockResolvedValueOnce(jsonUpstashResponse({ keys: [publicJwk] }))
            .mockResolvedValueOnce(jsonUpstashResponse({ result: JSON.stringify([existingWorkout, { id: 'new-concurrent-workout' }]) }))
            .mockResolvedValueOnce(jsonUpstashResponse({ result: 'OK' }));

        const response = await handler.fetch(
            new Request('https://app.test/api/workouts/workout-1', {
                method: 'PUT',
                headers: await authorizationHeaders('owner-user'),
                body: JSON.stringify({ name: 'New name', createdByUserId: 'attacker-user', updatedByUserId: 'attacker-user' })
            })
        );

        await expect(response.json()).resolves.toEqual(
            expect.objectContaining({
                id: 'workout-1',
                name: 'New name',
                createdAt: '2026-01-01-00:00:00',
                createdByUserId: 'owner-user',
                updatedByUserId: 'owner-user',
                updatedAt: expect.any(String)
            })
        );

        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://upstash.example/JSON.GET/tabata_workouts', expect.any(Object));

        const setCall = fetchMock.mock.calls[2] as [string, RequestInit];
        expect(setCall[0]).toBe('https://upstash.example');
        const command = JSON.parse(setCall[1].body as string) as [string, string, string, string];
        expect(command[0]).toBe('JSON.SET');
        expect(command[1]).toBe('tabata_workouts');
        expect(command[2]).toBe('$[?(@.id=="workout-1")]');
        expect(JSON.parse(command[3])).toEqual(
            expect.objectContaining({
                id: 'workout-1',
                name: 'New name',
                createdAt: '2026-01-01-00:00:00',
                createdByUserId: 'owner-user',
                updatedByUserId: 'owner-user'
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

describe.each(collectionHandlers)('workouts API $name collection mutations', ({ handler }) => {
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

    it('keeps legacy public workouts readable while hiding owner-stamped workouts from anonymous list reads', async () => {
        const legacyWorkout = { id: 'legacy-workout', name: 'Legacy public workout' };
        const privateWorkout = { id: 'private-workout', name: 'Private workout', createdByUserId: 'owner-user' };
        fetchMock.mockResolvedValueOnce(jsonUpstashResponse({ result: JSON.stringify([legacyWorkout, privateWorkout]) }));

        const response = await handler.fetch(new Request('https://app.test/api/workouts'));

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual([legacyWorkout]);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://upstash.example/JSON.GET/tabata_workouts', expect.any(Object));
    });

    it('returns legacy public workouts and owned workouts to an authenticated list reader', async () => {
        const legacyWorkout = { id: 'legacy-workout', name: 'Legacy public workout' };
        const ownedWorkout = { id: 'owned-workout', name: 'Owned workout', createdByUserId: 'owner-user' };
        const otherWorkout = { id: 'other-workout', name: 'Other workout', createdByUserId: 'other-user' };
        fetchMock
            .mockResolvedValueOnce(jsonUpstashResponse({ keys: [publicJwk] }))
            .mockResolvedValueOnce(jsonUpstashResponse({ result: JSON.stringify([legacyWorkout, ownedWorkout, otherWorkout]) }));

        const response = await handler.fetch(new Request('https://app.test/api/workouts', { headers: await authorizationHeaders('owner-user') }));

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual([legacyWorkout, ownedWorkout]);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://upstash.example/JSON.GET/tabata_workouts', expect.any(Object));
    });

    it('stamps new workouts with the authenticated user instead of trusting the request body owner', async () => {
        fetchMock.mockResolvedValueOnce(jsonUpstashResponse({ keys: [publicJwk] })).mockResolvedValueOnce(jsonUpstashResponse({ result: 1 }));

        const response = await handler.fetch(
            new Request('https://app.test/api/workouts', {
                method: 'POST',
                headers: await authorizationHeaders('owner-user'),
                body: JSON.stringify({ name: 'New workout', createdByUserId: 'attacker-user', updatedByUserId: 'attacker-user' })
            })
        );

        await expect(response.json()).resolves.toEqual(
            expect.objectContaining({
                name: 'New workout',
                createdByUserId: 'owner-user',
                updatedByUserId: 'owner-user'
            })
        );

        expect(fetchMock).toHaveBeenCalledTimes(2);
        const appendCall = fetchMock.mock.calls[1] as [string, RequestInit];
        expect(appendCall[0]).toBe('https://upstash.example/JSON.ARRAPPEND/tabata_workouts/$');
        expect(JSON.parse(appendCall[1].body as string)).toEqual(
            expect.objectContaining({
                name: 'New workout',
                createdByUserId: 'owner-user',
                updatedByUserId: 'owner-user'
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
    return new Response(JSON.stringify(body), { status: 200 });
}

function encodeJson(value: unknown): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
}
