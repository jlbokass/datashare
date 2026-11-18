import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Register } from './register';

describe('Register', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('rejects a short password before contacting the API', () => {
    const fixture = TestBed.createComponent(Register);
    const register = fixture.componentInstance;
    register.form.setValue({
      email: 'person@example.com',
      password: 'short',
      passwordConfirmation: 'short',
    });

    register.submit();

    expect(register.form.invalid).toBe(true);
    expect(TestBed.inject(HttpTestingController).match('/api/auth/register')).toHaveLength(0);
  });

  it('rejects mismatched password confirmation', () => {
    const fixture = TestBed.createComponent(Register);
    const register = fixture.componentInstance;
    register.form.setValue({
      email: 'person@example.com',
      password: 'StrongPass123!',
      passwordConfirmation: 'DifferentPass123!',
    });

    register.submit();

    expect(register.form.hasError('passwordMismatch')).toBe(true);
    expect(TestBed.inject(HttpTestingController).match('/api/auth/register')).toHaveLength(0);
  });

  it('posts only email and password and confirms success', () => {
    const fixture = TestBed.createComponent(Register);
    const register = fixture.componentInstance;
    register.form.setValue({
      email: 'person@example.com',
      password: 'StrongPass123!',
      passwordConfirmation: 'StrongPass123!',
    });

    register.submit();

    const request = TestBed.inject(HttpTestingController).expectOne('/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'person@example.com',
      password: 'StrongPass123!',
    });
    request.flush({
      user: { id: '550e8400-e29b-41d4-a716-446655440000', email: 'person@example.com', created_at: '2026-11-18T10:00:00Z' },
    }, { status: 201, statusText: 'Created' });

    expect(register.created()).toBe(true);
    expect(register.submitting()).toBe(false);
  });

  it('shows a server-side duplicate-email error', () => {
    const fixture = TestBed.createComponent(Register);
    const register = fixture.componentInstance;
    register.form.setValue({
      email: 'person@example.com',
      password: 'StrongPass123!',
      passwordConfirmation: 'StrongPass123!',
    });

    register.submit();

    const request = TestBed.inject(HttpTestingController).expectOne('/api/auth/register');
    request.flush({
      message: 'The provided data is invalid.',
      code: 'validation_error',
      errors: { email: ['The email has already been taken.'] },
    }, { status: 422, statusText: 'Unprocessable Entity' });

    expect(register.fieldErrors()['email']).toHaveLength(1);
    expect(register.created()).toBe(false);
    expect(register.submitting()).toBe(false);
  });
});
