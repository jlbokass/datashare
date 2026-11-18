import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Login } from './login';

describe('Login', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('rejects invalid email without making a request', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.componentInstance.form.setValue({ email: 'bad-email', password: 'password' });
    fixture.componentInstance.submit();
    expect(TestBed.inject(HttpTestingController).match('/api/auth/login')).toHaveLength(0);
  });

  it('posts a normalized email and password to Laravel', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.componentInstance.form.setValue({ email: 'PERSON@EXAMPLE.COM', password: 'StrongPass123!' });
    fixture.componentInstance.submit();

    const req = TestBed.inject(HttpTestingController).expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'person@example.com', password: 'StrongPass123!' });
    req.flush({
      access_token: 'example.jwt.signature', token_type: 'Bearer',
      user: { id: 'id', email: 'person@example.com', created_at: '2026-11-18T10:00:00Z' },
    });
    expect(fixture.componentInstance.submitting()).toBe(false);
  });

  it('shows the generic French message on bad credentials', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.componentInstance.form.setValue({ email: 'person@example.com', password: 'wrong' });
    fixture.componentInstance.submit();

    TestBed.inject(HttpTestingController).expectOne('/api/auth/login').flush({
      message: 'Email ou mot de passe incorrect.', code: 'unauthenticated',
    }, { status: 401, statusText: 'Unauthorized' });

    expect(fixture.componentInstance.errorMessage()).toBe('Email ou mot de passe incorrect.');
    expect(fixture.componentInstance.submitting()).toBe(false);
  });
});
