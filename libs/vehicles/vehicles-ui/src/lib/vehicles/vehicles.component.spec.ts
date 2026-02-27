import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { VehiclesComponent } from './vehicles.component';
import { VehiclesFacade } from '@silver/vehicles-store';
import { provideAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { Filter, Vehicle } from '@silver/vehicles-store';

describe('VehiclesComponent', () => {
    let component: VehiclesComponent;
    let fixture: ComponentFixture<VehiclesComponent>;
    let facade: VehiclesFacade;

    const mockVehicles: Vehicle[] = [
        { id: 1, type: 'car', brand: 'Bugatti Veyron', img: '1.jpg', colors: ['red', 'black'] },
        { id: 2, type: 'airplane', brand: 'Boeing 787', img: '2.jpg', colors: ['red', 'white'] }
    ];

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [VehiclesComponent],
            providers: [
                provideAnimations(),
                {
                    provide: VehiclesFacade,
                    useValue: {
                        filteredVehicles: signal<Vehicle[]>(mockVehicles),
                        loading: signal(false),
                        error: signal<string | null>(null),
                        types: signal<string[]>(['car', 'airplane']),
                        brands: signal<string[]>(['Bugatti Veyron', 'Boeing 787']),
                        colors: signal<string[]>(['red', 'black', 'white']),
                        loadAll: jest.fn(),
                        loadByFilter: jest.fn(),
                        clearError: jest.fn()
                    }
                }
            ]
        }).compileComponents();
        facade = TestBed.inject(VehiclesFacade);
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VehiclesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create VehiclesComponent', () => {
        expect(component).toBeTruthy();
    });

    it('should load all vehicles on init', () => {
        component.ngOnInit();
        expect(facade.loadAll).toHaveBeenCalled();
    });

    it('should call loadByFilter when updateFilter is called', () => {
        const filter: Filter = { type: 'car', brand: '', color: '' };
        component.updateFilter(filter);
        expect(facade.loadByFilter).toHaveBeenCalledWith(filter);
    });

    it('should expose facade signals', () => {
        expect(component.filteredVehicles).toBeDefined();
        expect(component.loading).toBeDefined();
        expect(component.types).toBeDefined();
        expect(component.brands).toBeDefined();
        expect(component.colors).toBeDefined();
    });

    it('should display filtered vehicles', () => {
        expect(component.filteredVehicles().length).toBe(2);
        expect(component.filteredVehicles()[0].type).toBe('car');
    });
});
