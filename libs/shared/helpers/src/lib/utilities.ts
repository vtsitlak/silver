import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

export function isNonNullish<T>(item: T): item is NonNullable<T> {
    return item !== null && item !== undefined;
}

export function isNonEmpty(item: string | undefined | null): item is NonNullable<string> {
    return isNonNullish(item) && item !== '';
}

type Nullish<T> = T extends null | undefined ? T : never;

export function isNullish<T>(item: T): item is Nullish<T> {
    return item === null || item === undefined;
}

export const filterIsNonNullish = filter(isNonNullish);

export function isEmptyOrNullish<T>(item: T): item is Nullish<T> {
    return isNullish(item) || (Array.isArray(item) && item.length === 0);
}

export function isAllElementsDefined<T>(array: T[]): array is Array<NonNullable<T>> {
    return !array.some(isNullish);
}

export function isTrue(value: unknown): value is true {
    return isNonNullish(value) && Boolean(value);
}

export function isNavigationEndEvent(event: unknown): event is NavigationEnd {
    return event instanceof NavigationEnd;
}

export function deepEqual<T>(a: T, b: T) {
    return JSON.stringify(a) === JSON.stringify(b);
}

export const cloneDeep = <T>(value: T): T => structuredClone(value);

export const isDeepEqual = (valueA: object, valueB: object): boolean => {
    if (valueA === valueB) {
        return true;
    }

    if (!isObject(valueA) || !isObject(valueB)) {
        return false;
    }

    const keysA: string[] = Object.keys(valueA);
    const keysB: string[] = Object.keys(valueB);

    if (keysA.length !== keysB.length) {
        return false;
    }

    for (const key of keysA) {
        if (!keysB.includes(key) || !isDeepEqual((valueA as any)[key], (valueB as any)[key])) {
            return false;
        }
    }

    return true;
};

export type OptionalKeys<T> = {
    [K in keyof T]-?: object extends { [P in K]: T[K] } ? K : never;
}[keyof T];

export type RequiredKeys<T> = {
    [K in keyof T]-?: object extends { [P in K]: T[K] } ? never : K;
}[keyof T];

export type Nullable<T> = T | null;

export enum BooleanString {
    TRUE = 'true',
    FALSE = 'false'
}

enum CommonTypes {
    OBJECT = 'Object',
    STRING = 'String',
    NUMBER = 'Number',
    DATE = 'Date'
}
export const isString = (x: unknown): x is string => Object.prototype.toString.call(x) === `[object ${CommonTypes.STRING}]`;
export const isNumber = (x: unknown): x is number => Object.prototype.toString.call(x) === `[object ${CommonTypes.NUMBER}]`;
export const isDate = (x: unknown): x is Date => Object.prototype.toString.call(x) === `[object ${CommonTypes.DATE}]`;
export const isObject = (x: unknown): x is object => Object.prototype.toString.call(x) === `[object ${CommonTypes.OBJECT}]`;
