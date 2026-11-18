import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('stores a bearer token in memory and verifies /me', () => {
    auth.login('person@example.com', 'StrongPass123!').subscribe();
    const login = http.expectOne('/api/auth/login');
    expect(login.request.method).toBe('POST');
    expect(login.request.body).toEqual({ email: 'person@example.com', password: 'StrongPass123!' });

    const user = { id: '550e8400-e29b-41d4-a716-446655440000', email: 'person@example.com', created_at: '2026-11-18T10:00:00Z' };
    login.flush({ access_token: 'example.jwt.signature', token_type: 'Bearer', user });
    expect(auth.signedIn()).toBe(true);
    expect(auth.user()).toEqual(user);

    auth.me().subscribe();
    const me = http.expectOne('/api/auth/me');
    expect(me.request.headers.get('Authorization')).toBe('Bearer example.jwt.signature');
    me.flush({ user });
  });

  it('clears the local session on logout', () => {
    auth.login('person@example.com', 'StrongPass123!').subscribe();
    http.expectOne('/api/auth/login').flush({
      access_token: 'example.jwt.signature', token_type: 'Bearer',
      user: { id: 'id', email: 'person@example.com', created_at: '2026-11-18T10:00:00Z' },
    });

    auth.logout();
    expect(auth.signedIn()).toBe(false);
    expect(auth.user()).toBeNull();
  });

  it('clears the session on an expired token response', () => {
    auth.login('person@example.com', 'StrongPass123!').subscribe();
    http.expectOne('/api/auth/login').flush({
      access_token: 'example.jwt.signature', token_type: 'Bearer',
      user: { id: 'id', email: 'person@example.com', created_at: '2026-11-18T10:00:00Z' },
    });

    auth.me().subscribe({ error: () => {} });
    http.expectOne('/api/auth/me').flush({
      message: 'Authentification requise ou session expirée.', code: 'unauthenticated',
    }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.signedIn()).toBe(false);
  });
});
