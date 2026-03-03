import { Injectable } from '@angular/core';

export const environment = {
    production: false,
    /** Set to your Vercel deployment URL when running locally (nx serve) so the app calls the deployed API. Leave empty when deployed on Vercel. */
    workoutsApiBaseUrl: 'https://silver-dtr6seeef-vtsitlaks-project.vercel.app',
    firebaseConfig: {
        apiKey: 'AIzaSyBuBiPCViFoS6G37VvoAf6h800gMqf-Jp8',
        authDomain: 'tabata-ai-player.firebaseapp.com',
        projectId: 'tabata-ai-player',
        storageBucket: 'tabata-ai-player.firebasestorage.app',
        messagingSenderId: '879881563219',
        appId: '1:879881563219:web:2996f387fb1e4d0a232aa6',
        measurementId: 'G-KPSPCHVV4V'
    }
};

@Injectable({
    providedIn: 'root'
})
export class FirebaseConfig {}
