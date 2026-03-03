import { firebaseConfig } from './firebase-config';

export const environment = {
    production: false,
    /** Set to your Vercel deployment URL when running locally (nx serve) so the app calls the deployed API. Leave empty when deployed on Vercel. */
    workoutsApiBaseUrl: 'https://silver-tabata-ai.vercel.app',
    firebaseConfig
};
