/**
 * REST API for exercises using free-exercise-db (https://github.com/yuhonas/free-exercise-db).
 * Data is fetched from raw GitHub on cold start and cached in memory.
 * Response shapes match ExerciseDB v1 so the Angular app works without changes.
 * Full control over filtering: OR for muscles, equipment, bodyParts; search; pagination.
 */

const FREE_EXERCISE_DB_JSON_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

function jsonResponse(body: string, status: number): Response {
    return new Response(body, {
        status,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
}

interface FreeExerciseDbItem {
    id: string;
    name: string;
    equipment: string | null;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    instructions: string[];
    category: string;
    images: string[];
}

interface Exercise {
    exerciseId: string;
    name: string;
    gifUrl: string;
    targetMuscles: string[];
    bodyParts: string[];
    equipments: string[];
    secondaryMuscles: string[];
    instructions: string[];
}

function mapToExercise(raw: FreeExerciseDbItem): Exercise {
    const firstImage = Array.isArray(raw.images) && raw.images.length > 0 ? raw.images[0] : '';
    const gifUrl = firstImage ? `${IMAGE_BASE}${firstImage}` : '';
    return {
        exerciseId: raw.id,
        name: raw.name,
        gifUrl,
        targetMuscles: Array.isArray(raw.primaryMuscles) ? [...raw.primaryMuscles] : [],
        bodyParts: raw.category ? [raw.category] : [],
        equipments: raw.equipment ? [raw.equipment] : [],
        secondaryMuscles: Array.isArray(raw.secondaryMuscles) ? [...raw.secondaryMuscles] : [],
        instructions: Array.isArray(raw.instructions) ? [...raw.instructions] : []
    };
}

let cachedExercises: Exercise[] | null = null;

async function getExercises(): Promise<Exercise[]> {
    if (cachedExercises) return cachedExercises;
    const res = await fetch(FREE_EXERCISE_DB_JSON_URL);
    if (!res.ok) throw new Error(`Failed to fetch exercises: ${res.status}`);
    const raw = (await res.json()) as FreeExerciseDbItem[];
    cachedExercises = raw.map(mapToExercise);
    return cachedExercises;
}

function parseCommaList(value: string | null): string[] {
    if (!value || typeof value !== 'string') return [];
    return value
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
}

function matchesSearch(ex: Exercise, term: string): boolean {
    if (!term) return true;
    const t = term.toLowerCase();
    if (ex.name.toLowerCase().includes(t)) return true;
    if (ex.instructions.some((i) => i.toLowerCase().includes(t))) return true;
    return false;
}

function matchesMuscles(ex: Exercise, muscles: string[]): boolean {
    if (muscles.length === 0) return true;
    const primary = ex.targetMuscles.map((m) => m.toLowerCase());
    const secondary = ex.secondaryMuscles.map((m) => m.toLowerCase());
    return muscles.some((m) => primary.includes(m) || secondary.includes(m));
}

function matchesEquipment(ex: Exercise, equipment: string[]): boolean {
    if (equipment.length === 0) return true;
    const exEq = ex.equipments.map((e) => e.toLowerCase());
    return equipment.some((e) => exEq.includes(e));
}

function matchesBodyParts(ex: Exercise, bodyParts: string[]): boolean {
    if (bodyParts.length === 0) return true;
    const exBp = ex.bodyParts.map((b) => b.toLowerCase());
    return bodyParts.some((b) => exBp.includes(b));
}

function sortExercises(exercises: Exercise[], sortBy: string, sortOrder: string): Exercise[] {
    const order = sortOrder === 'asc' ? 1 : -1;
    return [...exercises].sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;
        switch (sortBy) {
            case 'exerciseId':
                aVal = a.exerciseId;
                bVal = b.exerciseId;
                break;
            case 'targetMuscles':
                aVal = (a.targetMuscles[0] ?? '').toLowerCase();
                bVal = (b.targetMuscles[0] ?? '').toLowerCase();
                break;
            case 'bodyParts':
                aVal = (a.bodyParts[0] ?? '').toLowerCase();
                bVal = (b.bodyParts[0] ?? '').toLowerCase();
                break;
            case 'equipments':
                aVal = (a.equipments[0] ?? '').toLowerCase();
                bVal = (b.equipments[0] ?? '').toLowerCase();
                break;
            default:
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
        }
        if (aVal < bVal) return -1 * order;
        if (aVal > bVal) return 1 * order;
        return 0;
    });
}

export default {
    async fetch(request: Request): Promise<Response> {
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }
        if (request.method !== 'GET') {
            return jsonResponse(JSON.stringify({ error: 'Method not allowed' }), 405);
        }

        const url = new URL(request.url);
        const pathParts = url.pathname.replace(/^\/+/, '').split('/');
        const isExercisesDb = pathParts[0] === 'api' && pathParts[1] === 'exercises-db';
        const subPath = isExercisesDb ? pathParts.slice(2).join('/') : '';

        try {
            const exercises = await getExercises();

            if (subPath === 'muscles') {
                const names = new Set<string>();
                exercises.forEach((ex) => {
                    ex.targetMuscles.forEach((m) => names.add(m));
                    ex.secondaryMuscles.forEach((m) => names.add(m));
                });
                const data = Array.from(names)
                    .sort()
                    .map((name) => ({ name }));
                return jsonResponse(JSON.stringify({ success: true, data }), 200);
            }

            if (subPath === 'equipments') {
                const names = new Set<string>();
                exercises.forEach((ex) => ex.equipments.forEach((e) => names.add(e)));
                const data = Array.from(names)
                    .sort()
                    .map((name) => ({ name }));
                return jsonResponse(JSON.stringify({ success: true, data }), 200);
            }

            if (subPath === 'bodyparts') {
                const names = new Set<string>();
                exercises.forEach((ex) => ex.bodyParts.forEach((b) => names.add(b)));
                const data = Array.from(names)
                    .sort()
                    .map((name) => ({ name }));
                return jsonResponse(JSON.stringify({ success: true, data }), 200);
            }

            if (subPath.startsWith('exercises/')) {
                const afterExercises = subPath.slice('exercises/'.length);
                const isFilter = afterExercises === 'filter';
                const exerciseId = !isFilter && !afterExercises.includes('/') ? decodeURIComponent(afterExercises) : null;

                if (exerciseId) {
                    const ex = exercises.find((e) => e.exerciseId === exerciseId);
                    if (!ex) return jsonResponse(JSON.stringify({ success: false, data: null }), 200);
                    return jsonResponse(JSON.stringify({ success: true, data: ex }), 200);
                }

                if (isFilter) {
                    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
                    const muscles = parseCommaList(url.searchParams.get('muscles'));
                    const equipment = parseCommaList(url.searchParams.get('equipment'));
                    const bodyParts = parseCommaList(url.searchParams.get('bodyParts'));
                    const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);
                    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
                    const sortBy = url.searchParams.get('sortBy') ?? 'name';
                    const sortOrder = url.searchParams.get('sortOrder') ?? 'desc';

                    let filtered = exercises.filter(
                        (ex) => matchesSearch(ex, search) && matchesMuscles(ex, muscles) && matchesEquipment(ex, equipment) && matchesBodyParts(ex, bodyParts)
                    );
                    filtered = sortExercises(filtered, sortBy, sortOrder);
                    const total = filtered.length;
                    const page = Math.floor(offset / limit) + 1;
                    const totalPages = Math.ceil(total / limit) || 1;
                    const slice = filtered.slice(offset, offset + limit);
                    const metadata = {
                        totalExercises: total,
                        totalPages,
                        currentPage: page,
                        previousPage: page > 1 ? String(page - 1) : null,
                        nextPage: page < totalPages ? String(page + 1) : null
                    };
                    return jsonResponse(
                        JSON.stringify({
                            success: true,
                            data: slice,
                            metadata
                        }),
                        200
                    );
                }
            }

            return jsonResponse(JSON.stringify({ error: 'Not found' }), 404);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return jsonResponse(JSON.stringify({ error: message }), 500);
        }
    }
};
