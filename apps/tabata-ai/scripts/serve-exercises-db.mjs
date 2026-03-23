/**
 * Local dev server for exercises-db API (same logic as api/exercises-db.ts).
 * Run with: node apps/tabata-ai/scripts/serve-exercises-db.mjs
 * Proxy in apps/tabata-ai/proxy.json points /api/exercises-db to this server.
 */

const FREE_EXERCISE_DB_JSON_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const EXCLUDED_CATEGORIES = new Set(['olympic weightlifting', 'powerlifting', 'strongman']);

const PORT = Number(process.env.EXERCISES_DB_PORT) || 3456;

let cachedExercises = null;

function hasExcludedCategory(exercise) {
    return exercise.category.some((category) => EXCLUDED_CATEGORIES.has(String(category).toLowerCase()));
}

async function getExercises() {
    if (cachedExercises) return cachedExercises;
    const res = await fetch(FREE_EXERCISE_DB_JSON_URL);
    if (!res.ok) throw new Error(`Failed to fetch exercises: ${res.status}`);
    const raw = await res.json();
    cachedExercises = raw
        .map((r) => {
            const images = Array.isArray(r.images) ? r.images.map((path) => (path ? `${IMAGE_BASE}${path}` : '')).filter(Boolean) : [];
            const level = r.level != null && String(r.level).trim() !== '' ? String(r.level).trim() : undefined;
            return {
                exerciseId: r.id,
                name: r.name,
                images,
                targetMuscles: Array.isArray(r.primaryMuscles) ? [...r.primaryMuscles] : [],
                category: r.category ? [r.category] : [],
                ...(level ? { level } : {}),
                equipments: r.equipment ? [r.equipment] : [],
                secondaryMuscles: Array.isArray(r.secondaryMuscles) ? [...r.secondaryMuscles] : [],
                instructions: Array.isArray(r.instructions) ? [...r.instructions] : []
            };
        })
        .filter((exercise) => !hasExcludedCategory(exercise));
    return cachedExercises;
}

function parseCommaList(value) {
    if (!value || typeof value !== 'string') return [];
    return value
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
}

function matchesSearch(ex, term) {
    if (!term) return true;
    const t = term.toLowerCase();
    if (ex.name.toLowerCase().includes(t)) return true;
    if (ex.instructions.some((i) => i.toLowerCase().includes(t))) return true;
    return false;
}

function matchesMuscles(ex, muscles) {
    if (muscles.length === 0) return true;
    const primary = ex.targetMuscles.map((m) => m.toLowerCase());
    const secondary = ex.secondaryMuscles.map((m) => m.toLowerCase());
    return muscles.some((m) => primary.includes(m) || secondary.includes(m));
}

function matchesEquipment(ex, equipment) {
    if (equipment.length === 0) return true;
    const exEq = ex.equipments.map((e) => e.toLowerCase());
    return equipment.some((e) => exEq.includes(e));
}

function matchesCategory(ex, category) {
    if (category.length === 0) return true;
    const exCat = ex.category.map((c) => c.toLowerCase());
    return category.some((c) => exCat.includes(c));
}

function matchesLevel(ex, level) {
    if (level.length === 0) return true;
    const exLevel = (ex.level ?? '').toLowerCase();
    return level.some((l) => exLevel === l);
}

function sortExercises(exercises, sortBy, sortOrder) {
    const order = sortOrder === 'asc' ? 1 : -1;
    return [...exercises].sort((a, b) => {
        let aVal, bVal;
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

export default async function createApp() {
    const { default: express } = await import('express');
    const app = express();

    app.use((req, res, next) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            return res.sendStatus(204);
        }
        next();
    });

    app.get('/api/exercises-db/muscles', async (req, res) => {
        try {
            const exercises = await getExercises();
            const names = new Set();
            exercises.forEach((ex) => {
                ex.targetMuscles.forEach((m) => names.add(m));
                ex.secondaryMuscles.forEach((m) => names.add(m));
            });
            const data = Array.from(names)
                .sort()
                .map((name) => ({ name }));
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/exercises-db/equipments', async (req, res) => {
        try {
            const exercises = await getExercises();
            const names = new Set();
            exercises.forEach((ex) => ex.equipments.forEach((e) => names.add(e)));
            const data = Array.from(names)
                .sort()
                .map((name) => ({ name }));
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/exercises-db/category', async (req, res) => {
        try {
            const exercises = await getExercises();
            const names = new Set();
            exercises.forEach((ex) => ex.category.forEach((c) => names.add(c)));
            const data = Array.from(names)
                .sort()
                .map((name) => ({ name }));
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/exercises-db/category/:categoryName/exercises', async (req, res) => {
        try {
            const exercises = await getExercises();
            const categoryName = decodeURIComponent(req.params.categoryName || '');
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '20', 10) || 20));
            const offset = Math.max(0, parseInt(req.query.offset ?? '0', 10) || 0);
            const filtered = exercises.filter((ex) => ex.category.some((c) => c.toLowerCase() === categoryName.toLowerCase()));
            const slice = filtered.slice(offset, offset + limit);
            const total = filtered.length;
            const totalPages = Math.ceil(total / limit) || 1;
            const page = Math.floor(offset / limit) + 1;
            res.json({
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
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/exercises-db/exercises/filter', async (req, res) => {
        try {
            const exercises = await getExercises();
            const search = (req.query.search ?? '').trim().toLowerCase();
            const muscles = parseCommaList(req.query.muscles ?? null);
            const equipment = parseCommaList(req.query.equipment ?? null);
            const category = parseCommaList(req.query.category ?? null);
            const level = parseCommaList(req.query.level ?? null);
            const offset = Math.max(0, parseInt(req.query.offset ?? '0', 10) || 0);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '20', 10) || 20));
            const sortBy = req.query.sortBy ?? 'name';
            const sortOrder = req.query.sortOrder ?? 'desc';

            let filtered = exercises.filter(
                (ex) =>
                    matchesSearch(ex, search) &&
                    matchesMuscles(ex, muscles) &&
                    matchesEquipment(ex, equipment) &&
                    matchesCategory(ex, category) &&
                    matchesLevel(ex, level)
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
            res.json({ success: true, data: slice, metadata });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/exercises-db/exercises/:id', async (req, res) => {
        try {
            const exercises = await getExercises();
            const ex = exercises.find((e) => e.exerciseId === decodeURIComponent(req.params.id));
            if (!ex) return res.json({ success: false, data: null });
            res.json({ success: true, data: ex });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return app;
}

createApp().then((app) => {
    app.listen(PORT, () => {
        console.log(`Exercises DB API at http://localhost:${PORT}/api/exercises-db`);
    });
});
