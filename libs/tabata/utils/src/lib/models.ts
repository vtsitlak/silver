export type BodyRegion = 'Upper Body' | 'Lower Body' | 'Full Body' | 'Core' | 'Cardio';

export interface TargetBodyRegions {
    bodyRegion: BodyRegion;
    bodyparts: string[];
}

export type EquipmentCategory = 'Machine' | 'Free Weight' | 'Functional Tool' | 'Accessory' | 'Bodyweight' | 'Other';

export interface EquipmentItem {
    equipmentCategory: EquipmentCategory;
    equipmentOptions: string[];
}

export interface MuscleMapping {
    region: BodyRegion;
    muscles: string[];
}

/** All body regions for main/secondary target selects. */
export const BODY_REGION_OPTIONS: BodyRegion[] = ['Upper Body', 'Lower Body', 'Core', 'Cardio', 'Full Body'];

/** Equipment categories for workout editor (excludes Bodyweight and Other). */
export const EQUIPMENT_CATEGORY_OPTIONS: EquipmentCategory[] = ['Machine', 'Free Weight', 'Functional Tool', 'Accessory'];

/**
 * Equipment options grouped by category, using values from free-exercise-db
 * (https://github.com/yuhonas/free-exercise-db) so that workout metadata
 * stays aligned with the underlying exercise data.
 */
export const equipmentOptions: EquipmentItem[] = [
    {
        equipmentCategory: 'Machine',
        equipmentOptions: ['machine']
    },
    {
        equipmentCategory: 'Free Weight',
        equipmentOptions: ['barbell', 'e-z curl bar', 'dumbbell', 'kettlebells']
    },
    {
        equipmentCategory: 'Functional Tool',
        equipmentOptions: ['medicine ball', 'exercise ball']
    },
    {
        equipmentCategory: 'Accessory',
        equipmentOptions: ['bands', 'cable', 'foam roll']
    },
    {
        equipmentCategory: 'Bodyweight',
        equipmentOptions: ['body only']
    },
    {
        equipmentCategory: 'Other',
        equipmentOptions: ['other']
    }
];

/**
 * Maps free-exercise-db muscles into coarse body regions
 * for main/secondary target selectors.
 */
export const muscleOptions: MuscleMapping[] = [
    {
        region: 'Upper Body',
        muscles: ['neck', 'shoulders', 'chest', 'biceps', 'triceps', 'forearms', 'traps', 'lats', 'middle back']
    },
    {
        region: 'Lower Body',
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves']
    },
    {
        region: 'Core',
        muscles: ['abdominals', 'lower back']
    },
    {
        region: 'Cardio',
        muscles: []
    },
    {
        region: 'Full Body',
        muscles: []
    }
];

/**
 * Target body-part groupings using muscle names from the new DB.
 * This is used by the workout editor for selecting main/secondary targets.
 */
export const targetBodypartsOptions: TargetBodyRegions[] = [
    {
        bodyRegion: 'Upper Body',
        bodyparts: ['neck', 'shoulders', 'chest', 'biceps', 'triceps', 'forearms', 'traps', 'lats', 'middle back']
    },
    {
        bodyRegion: 'Lower Body',
        bodyparts: ['quadriceps', 'hamstrings', 'glutes', 'calves']
    },
    {
        bodyRegion: 'Full Body',
        bodyparts: []
    },
    {
        bodyRegion: 'Core',
        bodyparts: ['abdominals', 'lower back']
    },
    {
        bodyRegion: 'Cardio',
        bodyparts: []
    }
];
