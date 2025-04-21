import { FormControl } from '@angular/forms';

export interface LoginForm {
    email: FormControl<string>;
    password: FormControl<string>;
}

export interface RegisterForm extends LoginForm {
    displayName: FormControl<string>;
}
