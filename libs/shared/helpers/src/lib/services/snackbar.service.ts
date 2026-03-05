import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export enum SnackBarType {
    Success = 'success',
    Error = 'error',
    Info = 'info'
}

const SNACKBAR_STYLES: Record<SnackBarType, string[]> = {
    [SnackBarType.Success]: ['!bg-green-600', 'text-white', 'font-medium'],
    [SnackBarType.Error]: ['!bg-red-600', 'text-white', 'font-medium'],
    [SnackBarType.Info]: ['!bg-blue-600', 'text-white', 'font-medium']
};

@Injectable({ providedIn: 'root' })
export class SnackBarService {
    private snackBar = inject(MatSnackBar);

    show(message: string, type: SnackBarType = SnackBarType.Info, action = 'Close'): void {
        this.snackBar.open(message, action, {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: SNACKBAR_STYLES[type]
        });
    }

    showSuccess(message: string): void {
        this.show(message, SnackBarType.Success);
    }

    showError(message: string): void {
        this.show(message, SnackBarType.Error);
    }
}
