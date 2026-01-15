import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';
import { VehiclesService } from '../services/vehicles.service';
import { Vehicle } from '../models/vehicle';
import { Filter } from '../models/filter';

type VehiclesState = {
  allVehicles: Vehicle[];
  filteredVehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  filter: Filter;
};

const initialState: VehiclesState = {
  allVehicles: [],
  filteredVehicles: [],
  loading: false,
  error: null,
  filter: { type: '', brand: '', color: '' },
};

export const VehiclesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    // Computed signals for dropdown options (based on all vehicles)
    types: () => {
      const vehicles = store.allVehicles();
      const typesSet = new Set<string>();
      vehicles.forEach(v => typesSet.add(v.type));
      return Array.from(typesSet);
    },
    brands: () => {
      const vehicles = store.allVehicles();
      const brandsSet = new Set<string>();
      vehicles.forEach(v => brandsSet.add(v.brand));
      return Array.from(brandsSet);
    },
    colors: () => {
      const vehicles = store.allVehicles();
      const colorsSet = new Set<string>();
      vehicles.forEach(v => v.colors.forEach(c => colorsSet.add(c)));
      return Array.from(colorsSet);
    },
  })),
  withMethods((store, vehiclesService = inject(VehiclesService)) => ({
    // Load all vehicles
    loadAll: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          vehiclesService.getAll().pipe(
            tap((vehicles: Vehicle[]) => {
              patchState(store, {
                allVehicles: vehicles,
                filteredVehicles: vehicles,
                loading: false,
                error: null,
              });
            }),
            catchError((error) => {
              patchState(store, {
                loading: false,
                error: error.message || 'Failed to load vehicles',
              });
              return of(null);
            })
          )
        )
      )
    ),
    // Load filtered vehicles
    loadByFilter: rxMethod<Filter>(
      pipe(
        tap((filter) => {
          patchState(store, { loading: true, error: null, filter });
        }),
        switchMap((filter) => {
          const hasAnyFilter = filter.type !== '' || filter.brand !== '' || filter.color !== '';

          if (!hasAnyFilter) {
            // No filters, use all vehicles
            patchState(store, {
              filteredVehicles: store.allVehicles(),
              loading: false,
            });
            return of(null);
          }

          return vehiclesService.getByFilter(filter).pipe(
            tap((vehicles: Vehicle[]) => {
              patchState(store, {
                filteredVehicles: vehicles,
                loading: false,
                error: null,
              });
            }),
            catchError((error) => {
              patchState(store, {
                loading: false,
                error: error.message || 'Failed to filter vehicles',
              });
              return of(null);
            })
          );
        })
      )
    ),
    // Update filter
    updateFilter: (filter: Filter) => {
      patchState(store, { filter });
    },
    // Clear error
    clearError: () => {
      patchState(store, { error: null });
    },
  }))
);
