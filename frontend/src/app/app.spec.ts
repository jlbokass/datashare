import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { HomeNavigation } from './pages/home-navigation';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('creates the application shell', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.brand')?.textContent).toContain('DataShare');
  });

  it('requests a fresh upload when the header brand is clicked', () => {
    const nav = TestBed.inject(HomeNavigation);
    let resets = 0;
    const subscription = nav.resetRequested$.subscribe(() => resets++);

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.brand') as HTMLAnchorElement).click();

    expect(resets).toBe(1);
    subscription.unsubscribe();
  });

  it('offers a login link before authentication', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a.header-link');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/login');
  });
});
