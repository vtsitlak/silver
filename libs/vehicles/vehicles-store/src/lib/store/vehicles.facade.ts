import { Injectable, inject } from '@angular/core';
import { VehiclesStore } from './vehicles.store';
import { Filter } from '../models/filter';

@Injectable({
  providedIn: 'root',
})
export class VehiclesFacade {
  private store = inject(VehiclesStore);

  // State signals
  readonly allVehicles = this.store.allVehicles;
  readonly filteredVehicles = this.store.filteredVehicles;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly filter = this.store.filter;

  // Computed signals
  readonly types = this.store.types;
  readonly brands = this.store.brands;
  readonly colors = this.store.colors;

  // Methods
  loadAll(): void {
    this.store.loadAll();
  }

  loadByFilter(filter: Filter): void {
    this.store.loadByFilter(filter);
  }

  updateFilter(filter: Filter): void {
    this.store.updateFilter(filter);
  }

  clearError(): void {
    this.store.clearError();
  }
}
