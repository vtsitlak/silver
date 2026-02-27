import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { isNonEmpty, isNonNullish, isNullish, NullableString } from '@silver/shared/helpers';

export interface LoginForm {
    email: FormControl<string>;
    password: FormControl<string>;
}

export interface RegisterForm extends LoginForm {
    displayName: FormControl<string>;
}

export interface ProfileForm {
    email: FormControl<string>;
    currentPassword: FormControl<NullableString>;
    newPassword: FormControl<NullableString>;
    confirmNewPassword: FormControl<NullableString>;
    displayName: FormControl<string>;
}

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const formGroup = control as FormGroup;
    const currentPassword = formGroup.get('newPasscurrentPassword')?.value;
    const newPassword = formGroup.get('newPassword')?.value;
    const confirmNewPassword = formGroup.get('confirmNewPassword')?.value;

    if (!isNonEmpty(currentPassword) && !isNonEmpty(newPassword) && !isNonEmpty(confirmNewPassword)) {
        return null;
    }

    // If changing password, confirm they match
    return newPassword?.length && newPassword === confirmNewPassword ? null : { passwordMismatch: true };
};
