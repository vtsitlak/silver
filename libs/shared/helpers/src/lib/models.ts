export interface TargetBodyRegions {
    bodyRegion: BodyRegion;
    bodyparts: string[];
}

export type BodyRegion = 'Upper Body' | 'Lower Body' | 'Full Body' | 'Core' | 'Cardio';

export const targetBodypartsOptions: TargetBodyRegions[] = [
    {
        bodyRegion: 'Upper Body',
        bodyparts: ['neck', 'shoulders', 'upper arms', 'lower arms', 'chest', 'back']
    },
    {
        bodyRegion: 'Lower Body',
        bodyparts: ['upper legs', 'lower legs']
    },
    {
        bodyRegion: 'Full Body',
        bodyparts: []
    },
    {
        bodyRegion: 'Core',
        bodyparts: ['waist']
    },
    {
        bodyRegion: 'Cardio',
        bodyparts: ['cardio']
    }
];

export type EquipmentCategory = 'Machine' | 'Free Weight' | 'Functional Tool' | 'Accessory' | 'Bodyweight';

export interface EquipmentItem {
    equipmentCategory: EquipmentCategory;
    equipmentOptions: string[];
}

export const equipmentOptions: EquipmentItem[] = [
    // Machines
    {
        equipmentCategory: 'Machine',
        equipmentOptions: [
            'stepmill machine',
            'elliptical machine',
            'stationary bike',
            'smith machine',
            'skierg machine',
            'upper body ergometer',
            'sled machine',
            'leverage machine',
            'cable',
            'assisted'
        ]
    },

    // Free Weights
    { equipmentCategory: 'Free Weight', equipmentOptions: ['barbell', 'olympic barbell', 'ez barbell', 'trap bar', 'dumbbell', 'kettlebell', 'weighted'] },

    // Functional Tools
    { equipmentCategory: 'Functional Tool', equipmentOptions: ['medicine ball', 'stability ball', 'bosu ball', 'tire', 'hammer', 'rope'] },

    // Accessories
    { equipmentCategory: 'Accessory', equipmentOptions: ['resistance band', 'band', 'wheel roller', 'roller'] },

    // Bodyweight
    { equipmentCategory: 'Bodyweight', equipmentOptions: ['body weight'] }
];

export interface MuscleMapping {
    region: BodyRegion;
    muscles: string[];
}

export const muscleOptions: MuscleMapping[] = [
    {
        region: 'Upper Body',
        muscles: [
            'hands',
            'sternocleidomastoid',
            'grip muscles',
            'wrist extensors',
            'wrist flexors',
            'latissimus dorsi',
            'upper chest',
            'rotator cuff',
            'wrists',
            'brachialis',
            'deltoids',
            'trapezius',
            'rear deltoids',
            'chest',
            'back',
            'shoulders',
            'rhomboids',
            'levator scapulae',
            'serratus anterior',
            'traps',
            'forearms',
            'delts',
            'biceps',
            'upper back',
            'triceps',
            'pectorals',
            'lats'
        ]
    },
    {
        region: 'Lower Body',
        muscles: [
            'shins',
            'soleus',
            'inner thighs',
            'groin',
            'feet',
            'ankles',
            'quadriceps',
            'ankle stabilizers',
            'abductors',
            'adductors',
            'hamstrings',
            'glutes',
            'calves',
            'quads'
        ]
    },
    {
        region: 'Core',
        muscles: ['lower abs', 'abdominals', 'core', 'obliques', 'lower back', 'hip flexors', 'spine', 'abs']
    },
    {
        region: 'Cardio',
        muscles: ['cardiovascular system']
    },
    {
        region: 'Full Body',
        muscles: ['full body']
    }
];
