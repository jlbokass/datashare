import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

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

  it('offers an accessible registration link', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a.header-link');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/register');
  });
});
