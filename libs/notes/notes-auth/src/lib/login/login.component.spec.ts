import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { LoginComponent } from './login.component';
import { AuthFacade } from '../store/auth.facade';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let facade: AuthFacade;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideAnimations(),
        {
          provide: AuthFacade,
          useValue: {
            login: jest.fn()
          }
        }
      ]
    }).compileComponents();
    facade = TestBed.inject(AuthFacade);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call facade login when login is called', () => {
    component.login();
    expect(facade.login).toHaveBeenCalledWith('user1@email.com', 'test');
  });
});
