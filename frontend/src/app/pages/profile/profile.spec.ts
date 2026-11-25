import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { Profile } from './profile';

describe('Profile', () => {
  const user = { id: 'owner-id', email: 'owner@example.com', name: null, first_name: null, created_at: '2026-11-18T10:00:00Z' };
  let fixture: ComponentFixture<Profile>;
  let http: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Profile],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    auth.login(user.email, 'StrongPass123!').subscribe();
    http.expectOne('/api/auth/login').flush({ access_token: 'example.jwt.signature', token_type: 'Bearer', user });
    fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function load() {
    const request = http.expectOne('/api/auth/me');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer example.jwt.signature');
    request.flush({ user });
    fixture.detectChanges();
  }

  it('shows the read-only email and saves or clears optional names with the bearer JWT', () => {
    load();
    const email = fixture.nativeElement.querySelector('#profile-email') as HTMLInputElement;
    expect(email.value).toBe(user.email);
    expect(email.readOnly).toBe(true);
    const profile = fixture.componentInstance;
    expect(profile.form.getRawValue()).toEqual({ name: '', first_name: '' });

    profile.form.setValue({ name: ' Dupont ', first_name: ' Élodie ' });
    profile.submit();
    const request = http.expectOne('/api/auth/me');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.headers.get('Authorization')).toBe('Bearer example.jwt.signature');
    expect(request.request.body).toEqual({ name: 'Dupont', first_name: 'Élodie' });
    const updated = { ...user, name: 'Dupont', first_name: 'Élodie' };
    request.flush({ user: updated });
    expect(auth.user()).toEqual(updated);
    expect(profile.saved()).toBe(true);
    profile.form.setValue({ name: '', first_name: '' });
    profile.submit();
    const clear = http.expectOne('/api/auth/me');
    expect(clear.request.body).toEqual({ name: null, first_name: null });
    clear.flush({ user });
    expect(profile.saved()).toBe(true);
  });

  it('rejects long names and preserves unsaved input on a failed update', () => {
    load();
    const profile = fixture.componentInstance;
    profile.form.setValue({ name: 'x'.repeat(256), first_name: '' });
    profile.submit();
    http.expectNone('/api/auth/me');
    expect(profile.form.invalid).toBe(true);
    profile.form.setValue({ name: 'Dupont', first_name: '' });
    profile.submit();
    http.expectOne('/api/auth/me').flush({}, { status: 422, statusText: 'Unprocessable Entity' });
    expect(profile.saved()).toBe(false);
    expect(profile.errorMessage()).toContain('Vérifie');
    expect(profile.form.controls.name.value).toBe('Dupont');
    expect(auth.user()).toEqual(user);
  });

  it('ends the session when the profile update returns 401', () => {
    load();
    fixture.componentInstance.submit();
    http.expectOne('/api/auth/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.signedIn()).toBe(false);
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
