import { Vehicle } from '@silver/vehicles-store';
import { Observable, of } from 'rxjs';

export const DATA: Vehicle[] = [
    {
        id: 1,
        type: 'car',
        brand: 'Bugatti Veyron',
        colors: ['red', 'black'],
        img: '1.jpg'
    },
    {
        id: 2,
        type: 'airplane',
        brand: 'Boeing 787 Dreamliner',
        colors: ['red', 'white', 'black', 'green'],
        img: '2.jpg'
    },
    {
        id: 3,
        type: 'train',
        brand: 'USRA 0-6-6',
        colors: ['yellow', 'white', 'black'],
        img: '3.JPG'
    },
    {
        id: 4,
        type: 'airplane',
        brand: 'Canadair North Star',
        colors: ['red', 'blue', 'yellow', 'green'],
        img: '4.jpg'
    },
    {
        id: 5,
        type: 'airplane',
        brand: 'Airbus A400M Atlas',
        colors: ['red', 'white'],
        img: '5.jpg'
    },
    {
        id: 6,
        type: 'airplane',
        brand: 'Bloch MB.131',
        colors: ['yellow', 'blue', 'brown'],
        img: '6.jpg'
    }
];


export class VehiclesServiceStub {

    getVehicles(): Observable<Vehicle[]> {
        return of(DATA);
    }
}
