process.env['UPSTASH_URL'] = 'https://upstash.example';
process.env['UPSTASH_TOKEN'] = 'test-token';

class TestRequest {
    readonly method: string;
    private readonly body: string | undefined;

    constructor(readonly url: string, init?: { method?: string; body?: string }) {
        this.method = init?.method ?? 'GET';
        this.body = init?.body;
    }

    async json(): Promise<unknown> {
        return this.body ? JSON.parse(this.body) : null;
    }
}

class TestResponse {
    readonly ok: boolean;
    readonly status: number;

    constructor(private readonly body: string | null, init?: { status?: number }) {
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

    beforeEach(() => {
        fetchMock = jest.fn();
        global.fetch = fetchMock;
    });

    it('stores PUT payloads in a per-user key instead of rewriting the shared legacy list', async () => {
        // Arrange
        const expectedRecord = {
            userId: 'user-1',
            favoriteWorkouts: ['w1'],
            workoutItems: [{ workoutId: 'w1', completed: true, startedAt: '2026-01-01', finishedAt: '2026-01-01' }]
        };
        fetchMock.mockResolvedValueOnce(jsonUpstashResponse({ result: 'OK' }));

        // Act
        const response = await handler.fetch(
            new Request('https://app.test/api/user-workouts/user-1', {
                method: 'PUT',
                body: JSON.stringify({ ...expectedRecord, userId: 'spoofed-user' })
            })
        );

        // Assert
        await expect(response.json()).resolves.toEqual(expectedRecord);
        expect(fetchMock).toHaveBeenCalledTimes(1);
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
            .mockResolvedValueOnce(jsonUpstashResponse({ result: null }))
            .mockResolvedValueOnce(jsonUpstashResponse({ result: JSON.stringify([legacyRecord]) }));

        // Act
        const response = await handler.fetch(new Request('https://app.test/api/user-workouts/legacy-user'));

        // Assert
        await expect(response.json()).resolves.toEqual(legacyRecord);
        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            'https://upstash.example',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(['JSON.GET', 'user_workouts:legacy-user'])
            })
        );
        expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://upstash.example/JSON.GET/user_workouts', expect.any(Object));
    });

    it('deletes both the per-user key and any legacy shared-list entry', async () => {
        // Arrange
        const legacyRecords = [
            { userId: 'other-user', favoriteWorkouts: [], workoutItems: [] },
            { userId: 'delete-me', favoriteWorkouts: ['w1'], workoutItems: [] }
        ];
        fetchMock
            .mockResolvedValueOnce(jsonUpstashResponse({ result: 1 }))
            .mockResolvedValueOnce(jsonUpstashResponse({ result: JSON.stringify(legacyRecords) }))
            .mockResolvedValueOnce(jsonUpstashResponse({ result: 1 }));

        // Act
        const response = await handler.fetch(new Request('https://app.test/api/user-workouts/delete-me', { method: 'DELETE' }));

        // Assert
        await expect(response.json()).resolves.toEqual({ success: true });
        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
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
                body: JSON.stringify(['JSON.DEL', 'user_workouts', '$[1]'])
            })
        );
    });
});

function jsonUpstashResponse(body: unknown): Response {
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
