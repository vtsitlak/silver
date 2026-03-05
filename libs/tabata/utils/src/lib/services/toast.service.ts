import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

export enum ToastType {
    Success = 'success',
    Error = 'error',
    Info = 'info'
}

const TOAST_COLORS: Record<ToastType, string> = {
    [ToastType.Success]: 'success',
    [ToastType.Error]: 'danger',
    [ToastType.Info]: 'primary'
};

@Injectable({ providedIn: 'root' })
export class ToastService {
    private toastController = inject(ToastController);

    async show(message: string, type: ToastType = ToastType.Info): Promise<void> {
        const toast = await this.toastController.create({
            message,
            duration: 4000,
            position: 'bottom',
            color: TOAST_COLORS[type]
        });
        await toast.present();
    }

    async showSuccess(message: string): Promise<void> {
        await this.show(message, ToastType.Success);
    }

    async showError(message: string): Promise<void> {
        await this.show(message, ToastType.Error);
    }
}
