import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from '../models/vehicle';


describe('VehiclesService', () => {

  let service: VehiclesService;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  const mockVehicles: Vehicle[] = [
    { id: 1, type: 'car', brand: 'citroen', img: '1.jpg', colors: ['black', 'silver'] },
    { id: 2, type: 'train', brand: 'train-brand', img: '2.jpg', colors: ['black', 'red'] },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(VehiclesService);
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get vehicles', () => {
    // Make an HTTP GET request
    httpClient.get<Vehicle[]>('/api/vehicles')
      .subscribe(data =>
        // When observable resolves, result should match test data
        expect(data).toEqual(mockVehicles)
      );

    // The following `expectOne()` will match the request's URL.
    // If no requests or multiple requests matched that URL
    // `expectOne()` would throw.
    const req = httpTestingController.expectOne('/api/vehicles');

    // Assert that the request is a GET.
    expect(req.request.method).toEqual('GET');

    // Respond with mock data, causing Observable to resolve.
    // Subscribe callback asserts that correct data was returned.
    req.flush(mockVehicles);

    // Finally, assert that there are no outstanding requests.
    httpTestingController.verify();
  });

  it('should get vehicles by filter', () => {
    const filter = { type: 'car', brand: '', color: '' };
    const filteredVehicles = [mockVehicles[0]];

    service.getByFilter(filter).subscribe(data =>
      expect(data).toEqual(filteredVehicles)
    );

    const req = httpTestingController.expectOne('/api/vehicles');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(filter);
    req.flush(filteredVehicles);
    httpTestingController.verify();
  });

  it('can test for network error', () => {
    const emsg = 'simulated network error';

    httpClient.get<Vehicle[]>('api/vehicles').subscribe(
      data => fail('should have failed with the network error'),
      (error: HttpErrorResponse) => {
        expect(error.error.message).toEqual(emsg, 'message');
      }
    );

    const req = httpTestingController.expectOne('api/vehicles');

    // Create mock ErrorEvent, raised when something goes wrong at the network level.
    // Connection timeout, DNS error, offline, etc
    const mockError = new ErrorEvent('Network error', {
      message: emsg,
    });

    // Respond with mock error
    req.error(mockError);
  });


  afterEach(() => {
    // After every test, assert that there are no more pending requests.
    httpTestingController.verify();
  });



});


// it('should be created', () => {
//   // const service: VehiclesService = TestBed.get(VehiclesService);
//   expect(service).toBeTruthy();
// });

// // describe('#getAll', () => {
// it('should return an Observable<Vehicle[]>', () => {
//   const vehiclesMock: Vehicle[] = [
//     { id: 1, type: 'car', brand: 'citroen', img: '1.jpg', colors: ['black', 'silver'] },
//     { id: 2, type: 'train', brand: 'train-brand', img: '2.jpg', colors: ['black', 'red'] },
//   ];

//   service.getAll().subscribe(vehicles => {
//     expect(vehicles.length).toBe(2);
//     expect(vehicles).toEqual(vehiclesMock);
//   });

//   const req = httpMock.expectOne(`api/vehicles`);
//   expect(req.request.method).toBe('GET');
//   req.flush(vehiclesMock);
// });
