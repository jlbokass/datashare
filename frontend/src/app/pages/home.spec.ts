import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Home } from './home';
import { HomeNavigation } from './home-navigation';

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

  it('starts a fresh transfer when the header brand is clicked on the current home route', () => {
    const fixture = TestBed.createComponent(Home);
    const home = fixture.componentInstance;
    home.setFiles([new File(['data'], 'report.pdf', { type: 'application/pdf' })]);
    home.shareUrl.set('http://127.0.0.1:8080/share/previous');
    home.expiresInDays.set(2);

    TestBed.inject(HomeNavigation).requestReset();

    expect(home.files()).toHaveLength(0);
    expect(home.shareUrl()).toBeNull();
    expect(home.expiresInDays()).toBe(7);
  });

  it('shows the five-minute demo only when enabled by Laravel', () => {
    signIn();
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    http.expectOne('/api/demo/capabilities').flush({ five_minute_expiry: true });

    const home = fixture.componentInstance;
    home.setFiles([new File(['%PDF-1.4'], 'demo.pdf', { type: 'application/pdf' })]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('option[value="demo5"]')).not.toBeNull();
    home.changeExpiry({ target: { value: 'demo5' } } as unknown as Event);
    home.upload();

    const request = http.expectOne('/api/transfers');
    expect(request.request.body.get('expires_in_minutes')).toBe('5');
    expect(request.request.body.has('expires_in_days')).toBe(false);

    request.flush({
      transfer: {
        id: 'transfer-id',
        share_url: '/share/demo123',
        expires_at: '2026-11-18T12:05:00Z',
        files: [],
      },
    }, { status: 201, statusText: 'Created' });

    expect(home.shareUrl()).toContain('/share/demo123');
  });

  it('does not offer short demo expiry when the server flag is disabled', () => {
    signIn();
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    http.expectOne('/api/demo/capabilities').flush({ five_minute_expiry: false });
    fixture.detectChanges();

    expect(fixture.componentInstance.demoEnabled()).toBe(false);
    fixture.componentInstance.setFiles([new File(['%PDF-1.4'], 'demo.pdf', { type: 'application/pdf' })]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('option[value="demo5"]')).toBeNull();
  });

  it('rejects a dragged executable even when the browser file picker grays it out', () => {
    signIn();
    const fixture = TestBed.createComponent(Home);
    const home = fixture.componentInstance;

    home.onDrop({
      preventDefault: () => {},
      dataTransfer: { files: [new File(['payload'], 'malware.exe')] },
    } as unknown as DragEvent);

    expect(home.files()).toHaveLength(0);
    expect(home.errorMessage()).toContain('Type de fichier');
    expect(http.match('/api/transfers')).toHaveLength(0);
  });

});
