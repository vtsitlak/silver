import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FilterFormComponent } from './filter-form.component';

describe('FilterFormComponent', () => {
    let component: FilterFormComponent;
    let fixture: ComponentFixture<FilterFormComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [FilterFormComponent],
            providers: [provideAnimations()]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FilterFormComponent);
        component = fixture.componentInstance;
    });

    it('should create FilterFormComponent', () => {
        expect(component).toBeTruthy();
    });

    it('should render the filter form', () => {
        expect(() => fixture.detectChanges()).not.toThrow();
        expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
    });

    it('should have initial empty filter values', () => {
        expect(component.filterModel()).toEqual({ type: '', brand: '', color: '' });
    });

    it('should accept input values for types, brands, and colors', () => {
        fixture.componentRef.setInput('types', ['car', 'train']);
        fixture.componentRef.setInput('brands', ['citroen']);
        fixture.componentRef.setInput('colors', ['red', 'blue']);

        expect(component.types()).toEqual(['car', 'train']);
        expect(component.brands()).toEqual(['citroen']);
        expect(component.colors()).toEqual(['red', 'blue']);
    });

    it('should have updateFilter output', () => {
        expect(component.updateFilter).toBeDefined();
    });
});
