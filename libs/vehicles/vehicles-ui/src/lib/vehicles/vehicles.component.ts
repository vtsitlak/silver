import { Component, OnInit, inject, effect } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VehiclesFacade } from '@silver/vehicles-store';
import { Filter } from '@silver/vehicles-store';
import { FilterFormComponent } from '../filter-form/filter-form.component';
import { VehicleItemComponent } from '../vehicle-item/vehicle-item.component';

@Component({
    selector: 'app-vehicles',
    standalone: true,
    templateUrl: './vehicles.component.html',
    styleUrls: ['./vehicles.component.scss'],
    imports: [MatProgressSpinnerModule, MatSnackBarModule, FilterFormComponent, VehicleItemComponent]
})
export class VehiclesComponent implements OnInit {
    facade = inject(VehiclesFacade);
    private snackBar = inject(MatSnackBar);

    // Expose facade signals for template
    filteredVehicles = this.facade.filteredVehicles;
    loading = this.facade.loading;
    types = this.facade.types;
    brands = this.facade.brands;
    colors = this.facade.colors;

    constructor() {
        // Show error snackbar when error occurs
        effect(() => {
            const error = this.facade.error();
            if (error) {
                console.error(error);
                this.openSnackBar(error, 'reload');
                this.facade.clearError();
            }
        });
    }

    ngOnInit() {
        // Load all vehicles initially (for dropdown options)
        this.facade.loadAll();
    }

    // update the filter with the value emitted from the form and load filtered vehicles
    updateFilter(filterValues: Filter) {
        this.facade.loadByFilter(filterValues);
    }

    openSnackBar(message: string, action: string) {
        this.snackBar
            .open(message, action, {
                duration: 10000
            })
            .onAction()
            .subscribe(() => {
                window.location.reload();
            });
    }
}
