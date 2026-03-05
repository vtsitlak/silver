import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

export type ToastType = 'success' | 'error' | 'info';

@Injectable({ providedIn: 'root' })
export class ToastService {
    private toastController = inject(ToastController);

    async show(message: string, type: ToastType = 'info') {
        const toast = await this.toastController.create({
            message,
            duration: type === 'error' ? 4000 : 2000,
            position: 'bottom',
            color: this.getColor(type)
        });
        await toast.present();
    }

    async showSuccess(message: string) {
        await this.show(message, 'success');
    }

    async showError(message: string) {
        await this.show(message, 'error');
    }

    private getColor(type: ToastType): string {
        switch (type) {
            case 'success':
                return 'success';
            case 'error':
                return 'danger';
            default:
                return 'primary';
        }
    }
}
