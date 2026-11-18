import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Home } from './home';

describe('Home upload', () => {
  let http: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => http.verify());

  function signIn(): void {
    auth.login('sender@example.com', 'StrongPass123!').subscribe();
    http.expectOne('/api/auth/login').flush({
      access_token: 'test.jwt.signature',
      token_type: 'Bearer',
      user: { id: 'uuid', email: 'sender@example.com', created_at: '2026-11-18T10:00:00Z' },
    });
  }

  it('does not upload without a valid client session', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.componentInstance.setFiles([new File(['PDF'], 'report.pdf', { type: 'application/pdf' })]);
    fixture.componentInstance.upload();

    expect(http.match('/api/transfers')).toHaveLength(0);
  });

  it('rejects invalid file formats before a network request', () => {
    signIn();
    const fixture = TestBed.createComponent(Home);
    fixture.componentInstance.setFiles([new File(['script'], 'malware.exe')]);

    expect(fixture.componentInstance.files()).toHaveLength(0);
    expect(fixture.componentInstance.errorMessage()).toContain('Type de fichier');
    expect(http.match('/api/transfers')).toHaveLength(0);
  });

  it('sends multiple files and bearer token then shows generated share link', () => {
    signIn();
    const fixture = TestBed.createComponent(Home);
    const home = fixture.componentInstance;
    home.setFiles([
      new File(['%PDF-1.4'], 'one.pdf', { type: 'application/pdf' }),
      new File(['%PDF-1.4'], 'two.pdf', { type: 'application/pdf' }),
    ]);
    home.expiresInDays.set(2);
    home.upload();

    const request = http.expectOne('/api/transfers');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test.jwt.signature');
    expect(request.request.body instanceof FormData).toBe(true);
    expect(request.request.body.getAll('files[]')).toHaveLength(2);
    expect(request.request.body.get('expires_in_days')).toBe('2');

    request.flush({
      transfer: {
        id: 'transfer-id',
        share_url: '/share/abc123',
        expires_at: '2026-11-20T10:00:00Z',
        files: [],
      },
    }, { status: 201, statusText: 'Created' });

    expect(home.busy()).toBe(false);
    expect(home.shareUrl()).toContain('/share/abc123');
  });

  it('shows size validation without selecting an oversized file', () => {
    signIn();
    const fixture = TestBed.createComponent(Home);
    const file = new File(['content'], 'giant.pdf');
    Object.defineProperty(file, 'size', { value: 1_000_000_001 });

    fixture.componentInstance.setFiles([file]);

    expect(fixture.componentInstance.files()).toHaveLength(0);
    expect(fixture.componentInstance.errorMessage()).toContain('1 Go');
  });
});
