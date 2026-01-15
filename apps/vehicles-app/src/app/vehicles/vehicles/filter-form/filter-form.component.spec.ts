import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FilterFormComponent } from './filter-form.component';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('FilterFormComponent', () => {
  let component: FilterFormComponent;
  let fixture: ComponentFixture<FilterFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FilterFormComponent],
      providers: [provideAnimations()]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create FilterFormComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial empty filter values', () => {
    const filterValues = {
      type: component.filterForm.type().value(),
      brand: component.filterForm.brand().value(),
      color: component.filterForm.color().value(),
    };
    
    expect(filterValues.type).toBe('');
    expect(filterValues.brand).toBe('');
    expect(filterValues.color).toBe('');
  });

  it('should accept input values for types, brands, and colors', () => {
    fixture.componentRef.setInput('types', ['car', 'train']);
    fixture.componentRef.setInput('brands', ['citroen']);
    fixture.componentRef.setInput('colors', ['red', 'blue']);
    fixture.detectChanges();

    expect(component.types()).toEqual(['car', 'train']);
    expect(component.brands()).toEqual(['citroen']);
    expect(component.colors()).toEqual(['red', 'blue']);
  });

  it('should have updateFilter output', () => {
    expect(component.updateFilter).toBeDefined();
  });
});
