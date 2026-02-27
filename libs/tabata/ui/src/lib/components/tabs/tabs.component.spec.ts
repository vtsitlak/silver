import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TabsComponent } from './tabs.component';

describe('TabsPage', () => {
    let component: TabsComponent;
    let fixture: ComponentFixture<TabsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TabsComponent],
            providers: [provideRouter([])]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TabsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
