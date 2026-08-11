import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';
import { VehiclesService } from './vehicles.service';
import { Filter } from '../models/filter';
import { Vehicle } from '../models/vehicle';

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
    filter: { type: '', brand: '', color: '' }
};

/** Client-side filter matching vehicles-server getByFilter semantics. */
export function applyVehicleFilter(vehicles: Vehicle[], filter: Filter): Vehicle[] {
    const hasAnyFilter = filter.type !== '' || filter.brand !== '' || filter.color !== '';
    if (!hasAnyFilter) {
        return vehicles;
    }

    return vehicles.filter((vehicle) => {
        if (filter.type && vehicle.type !== filter.type) {
            return false;
        }
        if (filter.brand && vehicle.brand !== filter.brand) {
            return false;
        }
        if (filter.color && vehicle.colors.indexOf(filter.color) === -1) {
            return false;
        }
        return true;
    });
}

function hasActiveFilter(filter: Filter): boolean {
    return filter.type !== '' || filter.brand !== '' || filter.color !== '';
}

export const VehiclesStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed((store) => ({
        // Computed signals for dropdown options (based on all vehicles)
        types: () => {
            const vehicles = store.allVehicles();
            const typesSet = new Set<string>();
            vehicles.forEach((v) => typesSet.add(v.type));
            return Array.from(typesSet);
        },
        brands: () => {
            const vehicles = store.allVehicles();
            const brandsSet = new Set<string>();
            vehicles.forEach((v) => brandsSet.add(v.brand));
            return Array.from(brandsSet);
        },
        colors: () => {
            const vehicles = store.allVehicles();
            const colorsSet = new Set<string>();
            vehicles.forEach((v) => v.colors.forEach((c) => colorsSet.add(c)));
            return Array.from(colorsSet);
        }
    })),
    withMethods((store, vehiclesService = inject(VehiclesService)) => ({
        // Load all vehicles
        loadAll: rxMethod<void>(
            pipe(
                tap(() => patchState(store, { loading: true, error: null })),
                switchMap(() =>
                    vehiclesService.getAll().pipe(
                        tap((vehicles: Vehicle[]) => {
                            // Respect any filter chosen while loadAll was in flight so a late
                            // getAll response cannot stomp filtered results back to the full list.
                            const filter = store.filter();
                            patchState(store, {
                                allVehicles: vehicles,
                                filteredVehicles: applyVehicleFilter(vehicles, filter),
                                loading: false,
                                error: null
                            });
                        }),
                        catchError((error) => {
                            patchState(store, {
                                loading: false,
                                error: error.message || 'Failed to load vehicles'
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
                    if (!hasActiveFilter(filter)) {
                        // No filters: show the full catalog. loadAll owns the initial spinner.
                        patchState(store, {
                            filteredVehicles: store.allVehicles(),
                            loading: false
                        });
                        return of(null);
                    }

                    // Prefer filtering the already-loaded catalog when available so an in-flight
                    // loadAll completion and a filter POST cannot race to different list states.
                    const allVehicles = store.allVehicles();
                    if (allVehicles.length > 0) {
                        patchState(store, {
                            filteredVehicles: applyVehicleFilter(allVehicles, filter),
                            loading: false,
                            error: null
                        });
                        return of(null);
                    }

                    return vehiclesService.getByFilter(filter).pipe(
                        tap((vehicles: Vehicle[]) => {
                            // If loadAll finished while this request was in flight, prefer
                            // filtering the authoritative catalog over a possibly-stale POST body.
                            const latestAll = store.allVehicles();
                            patchState(store, {
                                filteredVehicles:
                                    latestAll.length > 0 ? applyVehicleFilter(latestAll, filter) : vehicles,
                                loading: false,
                                error: null
                            });
                        }),
                        catchError((error) => {
                            patchState(store, {
                                loading: false,
                                error: error.message || 'Failed to filter vehicles'
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
        }
    }))
);
