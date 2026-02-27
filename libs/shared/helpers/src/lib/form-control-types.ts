import { FormControl } from '@angular/forms';
import { Nullable } from './utilities';

export type StringControl = FormControl<NullableString>;
export type StringArrayControl = FormControl<NullableStringArray>;
export type NumberArrayControl = FormControl<NullableNumberArray>;
export type NumberControl = FormControl<NullableNumber>;
export type BooleanControl = FormControl<NullableBoolean>;
export type ArrayControl<T> = FormControl<NullableArray<T>>;

export type NullableString = Nullable<string>;
export type NullableStringArray = Nullable<string[]>;
export type NullableLocationArray = Nullable<Location[]>;
export type NullableNumber = Nullable<number>;
export type NullableNumberArray = Nullable<number[]>;
export type NullableBoolean = Nullable<boolean>;
export type NullableArray<T> = Nullable<T[]>;
