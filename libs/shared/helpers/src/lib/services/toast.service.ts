import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class ToastService {
    private toastController = inject(ToastController);

    async show(message: string) {
        const toast = await this.toastController.create({
            message,
            duration: 2000,
            position: 'bottom',
            color: 'primary'
        });
        await toast.present();
    }
}
