import { applyVehicleFilter } from './vehicles.store';
import { Filter } from '../models/filter';
import { Vehicle } from '../models/vehicle';

describe('applyVehicleFilter', () => {
    const vehicles: Vehicle[] = [
        { id: 1, type: 'car', brand: 'Bugatti Veyron', img: '1.jpg', colors: ['red', 'black'] },
        { id: 2, type: 'airplane', brand: 'Boeing 787', img: '2.jpg', colors: ['red', 'white'] },
        { id: 3, type: 'car', brand: 'Ferrari F40', img: '3.jpg', colors: ['red', 'yellow'] }
    ];

    it('returns all vehicles when filter is empty', () => {
        const filter: Filter = { type: '', brand: '', color: '' };
        expect(applyVehicleFilter(vehicles, filter)).toEqual(vehicles);
    });

    it('filters by type', () => {
        const filter: Filter = { type: 'car', brand: '', color: '' };
        expect(applyVehicleFilter(vehicles, filter).map((v) => v.id)).toEqual([1, 3]);
    });

    it('filters by type and color', () => {
        const filter: Filter = { type: 'car', brand: '', color: 'yellow' };
        expect(applyVehicleFilter(vehicles, filter).map((v) => v.id)).toEqual([3]);
    });

    it('returns empty when nothing matches', () => {
        const filter: Filter = { type: 'train', brand: '', color: '' };
        expect(applyVehicleFilter(vehicles, filter)).toEqual([]);
    });
});
