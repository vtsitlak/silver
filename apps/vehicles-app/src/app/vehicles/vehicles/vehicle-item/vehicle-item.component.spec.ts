import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { VehicleItemComponent } from './vehicle-item.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Vehicle } from '../../models/vehicle';

describe('VehicleItemComponent', () => {
  let component: VehicleItemComponent;
  let fixture: ComponentFixture<VehicleItemComponent>;
  let element: DebugElement;

  const vehicle: Vehicle = {
    id: 1,
    brand: 'Citroen',
    type: 'car',
    img: 'imglink.jpg',
    colors: ['silver']
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [VehicleItemComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VehicleItemComponent);
    element = fixture.debugElement.nativeElement;
    component = fixture.componentInstance;
    // Set input signal using setInput
    fixture.componentRef.setInput('vehicle', vehicle);
    fixture.detectChanges();
  });

  it('should create VehicleItemComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should diplay the vehicle brand, type and colors', () => {
    const brand = fixture.debugElement.query(By.css('.description'));

    expect(brand.nativeElement.textContent).toContain(vehicle.brand);
    expect(brand.nativeElement.textContent).toContain(vehicle.type);
    expect(brand.nativeElement.textContent).toContain(vehicle.colors);
  });

  it('should get the vehicle image link', () => {
    const link = fixture.debugElement.query(By.css('.image>img'));

    expect(link.nativeElement.src).toContain(vehicle.img);
  });
});
