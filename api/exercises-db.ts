/**
 * REST API for exercises using free-exercise-db (https://github.com/yuhonas/free-exercise-db).
 * Data is fetched from raw GitHub on cold start and cached in memory.
 * Response shapes match ExerciseDB v1 so the Angular app works without changes.
 * Full control over filtering: OR for muscles, equipment, category; search; pagination.
 */

const FREE_EXERCISE_DB_JSON_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

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
    images: string[];
    targetMuscles: string[];
    category: string[];
    equipments: string[];
    secondaryMuscles: string[];
    instructions: string[];
}

function mapToExercise(raw: FreeExerciseDbItem): Exercise {
    const images = Array.isArray(raw.images) ? raw.images.map((path) => (path ? `${IMAGE_BASE}${path}` : '')).filter(Boolean) : [];
    return {
        exerciseId: raw.id,
        name: raw.name,
        images,
        targetMuscles: Array.isArray(raw.primaryMuscles) ? [...raw.primaryMuscles] : [],
        category: raw.category ? [raw.category] : [],
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

function matchesCategory(ex: Exercise, category: string[]): boolean {
    if (category.length === 0) return true;
    const exCat = ex.category.map((c) => c.toLowerCase());
    return category.some((c) => exCat.includes(c));
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
            case 'category':
                aVal = (a.category[0] ?? '').toLowerCase();
                bVal = (b.category[0] ?? '').toLowerCase();
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

export default async function handler(req: any, res: any): Promise<void> {
    Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const url = new URL(req.url ?? '', `http://${req.headers?.host ?? 'localhost'}`);
    const pathname = url.pathname ?? '';
    const subPath = pathname.replace(/^\/api\/exercises-db\/?/, '');

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
            res.status(200).json({ success: true, data });
            return;
        }

        if (subPath === 'equipments') {
            const names = new Set<string>();
            exercises.forEach((ex) => ex.equipments.forEach((e) => names.add(e)));
            const data = Array.from(names)
                .sort()
                .map((name) => ({ name }));
            res.status(200).json({ success: true, data });
            return;
        }

        if (subPath === 'category') {
            const names = new Set<string>();
            exercises.forEach((ex) => ex.category.forEach((c) => names.add(c)));
            const data = Array.from(names)
                .sort()
                .map((name) => ({ name }));
            res.status(200).json({ success: true, data });
            return;
        }

        if (subPath.startsWith('category/')) {
            const after = subPath.slice('category/'.length);
            const slash = after.indexOf('/');
            const categoryName = slash === -1 ? decodeURIComponent(after) : decodeURIComponent(after.slice(0, slash));
            const rest = slash === -1 ? '' : after.slice(slash + 1);
            if (rest === 'exercises') {
                const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
                const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);
                const filtered = exercises.filter((ex) => ex.category.some((c) => c.toLowerCase() === categoryName.toLowerCase()));
                const slice = filtered.slice(offset, offset + limit);
                const total = filtered.length;
                const totalPages = Math.ceil(total / limit) || 1;
                const page = Math.floor(offset / limit) + 1;
                res.status(200).json({
                    success: true,
                    data: slice,
                    metadata: {
                        totalExercises: total,
                        totalPages,
                        currentPage: page,
                        previousPage: page > 1 ? String(page - 1) : null,
                        nextPage: page < totalPages ? String(page + 1) : null
                    }
                });
                return;
            }
        }

        if (subPath.startsWith('exercises/')) {
            const afterExercises = subPath.slice('exercises/'.length);
            const isFilter = afterExercises === 'filter';
            const exerciseId = !isFilter && !afterExercises.includes('/') ? decodeURIComponent(afterExercises) : null;

            if (exerciseId) {
                const ex = exercises.find((e) => e.exerciseId === exerciseId);
                if (!ex) {
                    res.status(200).json({ success: false, data: null });
                    return;
                }
                res.status(200).json({ success: true, data: ex });
                return;
            }

            if (isFilter) {
                const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
                const muscles = parseCommaList(url.searchParams.get('muscles'));
                const equipment = parseCommaList(url.searchParams.get('equipment'));
                const category = parseCommaList(url.searchParams.get('category'));
                const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);
                const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
                const sortBy = url.searchParams.get('sortBy') ?? 'name';
                const sortOrder = url.searchParams.get('sortOrder') ?? 'desc';

                let filtered = exercises.filter(
                    (ex) => matchesSearch(ex, search) && matchesMuscles(ex, muscles) && matchesEquipment(ex, equipment) && matchesCategory(ex, category)
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

                res.status(200).json({ success: true, data: slice, metadata });
                return;
            }
        }

        res.status(404).json({ error: 'Not found' });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        res.status(500).json({ error: message });
    }
}
