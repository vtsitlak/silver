import { Component, effect, input, output, signal } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormField, form } from '@angular/forms/signals';
import { Filter } from '@silver/vehicles-store';

@Component({
    selector: 'app-filter-form',
    templateUrl: './filter-form.component.html',
    styleUrls: ['./filter-form.component.scss'],
    imports: [MatFormFieldModule, MatSelectModule, FormField]
})
export class FilterFormComponent {
    private filterModel = signal<Filter>({ type: '', brand: '', color: '' });
    filterForm = form(this.filterModel);
    types = input<string[] | null>(null);
    brands = input<string[] | null>(null);
    colors = input<string[] | null>(null);
    updateFilter = output<Filter>();

    constructor() {
        effect(() => {
            // Only track actual field values, not form state
            this.updateFilter.emit({
                type: this.filterForm.type().value(),
                brand: this.filterForm.brand().value(),
                color: this.filterForm.color().value()
            });
        });
    }
}
