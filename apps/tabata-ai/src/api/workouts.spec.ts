process.env['UPSTASH_URL'] = 'https://upstash.example';
process.env['UPSTASH_TOKEN'] = 'test-token';

class TestRequest {
    readonly method: string;
    private readonly body: string | undefined;

    constructor(
        readonly url: string,
        init?: { method?: string; body?: string }
    ) {
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
    { name: 'root handler', handler: require('../../../../api/workouts').default as WorkoutsHandler },
    { name: 'root dynamic handler', handler: require('../../../../api/workouts/[id]').default as WorkoutsHandler }
];

describe.each(handlers)('workouts API $name', ({ handler }) => {
    let fetchMock: jest.Mock;

    beforeEach(() => {
        fetchMock = jest.fn();
        global.fetch = fetchMock;
    });

    it('deletes a workout with a filtered JSON.DEL instead of rewriting the shared list', async () => {
        // Arrange
        fetchMock.mockResolvedValueOnce(jsonUpstashResponse({ result: 1 }));

        // Act
        const response = await handler.fetch(new Request('https://app.test/api/workouts/workout-1', { method: 'DELETE' }));

        // Assert
        await expect(response.json()).resolves.toEqual({ success: true });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://upstash.example',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(['JSON.DEL', 'tabata_workouts', '$[?(@.id=="workout-1")]'])
            })
        );
    });

    it('updates only the matching workout element instead of writing a stale full-array snapshot', async () => {
        // Arrange
        const existingWorkout = { id: 'workout-1', name: 'Old name', createdAt: '2026-01-01-00:00:00', updatedAt: 'old' };
        fetchMock
            .mockResolvedValueOnce(jsonUpstashResponse({ result: JSON.stringify([existingWorkout, { id: 'new-concurrent-workout' }]) }))
            .mockResolvedValueOnce(jsonUpstashResponse({ result: 'OK' }));

        // Act
        const response = await handler.fetch(
            new Request('https://app.test/api/workouts/workout-1', {
                method: 'PUT',
                body: JSON.stringify({ name: 'New name' })
            })
        );

        // Assert
        await expect(response.json()).resolves.toEqual(
            expect.objectContaining({
                id: 'workout-1',
                name: 'New name',
                createdAt: '2026-01-01-00:00:00',
                updatedAt: expect.any(String)
            })
        );

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://upstash.example/JSON.GET/tabata_workouts', expect.any(Object));

        const setCall = fetchMock.mock.calls[1] as [string, RequestInit];
        expect(setCall[0]).toBe('https://upstash.example');
        const command = JSON.parse(setCall[1].body as string) as [string, string, string, string];
        expect(command[0]).toBe('JSON.SET');
        expect(command[1]).toBe('tabata_workouts');
        expect(command[2]).toBe('$[?(@.id=="workout-1")]');
        expect(JSON.parse(command[3])).toEqual(
            expect.objectContaining({
                id: 'workout-1',
                name: 'New name',
                createdAt: '2026-01-01-00:00:00'
            })
        );
    });
});

function jsonUpstashResponse(body: unknown): Response {
    return new Response(JSON.stringify(body), { status: 200 });
}
