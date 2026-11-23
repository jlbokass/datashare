import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from '../auth/auth.service';
import { authGuard } from '../auth/auth.guard';
import { Home } from './home';
import { HomeNavigation } from './home-navigation';

describe('Home upload', () => {
  let http: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([{ path: 'upload', component: Home, canActivate: [authGuard] }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
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

  it('keeps the anonymous upload icon decorative and links the login prompt', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    http.expectOne('/api/demo/capabilities').flush({ five_minute_expiry: false });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.hero-action--decorative')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a.hero-action')).toBeNull();
    expect(fixture.nativeElement.querySelector('.hero-hint a[href="/login"]')?.textContent)
      .toContain('Connecte-toi');
  });

  it('links the authenticated home icon to the dedicated upload route', () => {
    signIn();
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    http.expectOne('/api/demo/capabilities').flush({ five_minute_expiry: false });

    expect(fixture.nativeElement.querySelector('a.hero-action')?.getAttribute('href')).toBe('/upload');
    expect(fixture.nativeElement.querySelector('.upload-panel')).toBeNull();
  });

  it('displays the upload panel immediately on /upload without clicking the icon', async () => {
    signIn();
    const harness = await RouterTestingHarness.create();
    const home = await harness.navigateByUrl('/upload', Home);
    http.expectOne('/api/demo/capabilities').flush({ five_minute_expiry: false });
    harness.detectChanges();

    expect(home.uploadPanelOpen()).toBe(true);
    expect(harness.routeNativeElement?.querySelector('.upload-panel .empty-selection')).not.toBeNull();
    expect(harness.routeNativeElement?.querySelector('.upload-hero')).toBeNull();
    expect((harness.routeNativeElement?.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(true);

    home.setFiles([new File(['content'], 'report.pdf', { type: 'application/pdf' })]);
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('.selected-files .file-name')?.textContent)
      .toContain('report.pdf');

    home.removeFile(0);
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('.upload-panel .empty-selection')).not.toBeNull();

    home.reset();
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('.upload-panel .empty-selection')).not.toBeNull();
  });

  it('shows oversized selection inside the panel, disables upload, and allows replacement', () => {
    signIn();
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    http.expectOne('/api/demo/capabilities').flush({ five_minute_expiry: false });

    const tooLarge = new File(['content'], 'oversized.zip', { type: 'application/zip' });
    Object.defineProperty(tooLarge, 'size', { value: 3_100_000_000 });
    fixture.componentInstance.setFiles([tooLarge]);
    fixture.detectChanges();

    expect(fixture.componentInstance.files()).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('.upload-panel .file-name')?.textContent)
      .toContain('oversized.zip');
    expect(fixture.nativeElement.querySelector('.upload-panel [role="alert"]')?.textContent)
      .toContain('1 Go');
    expect((fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).disabled)
      .toBe(true);
    http.expectNone('/api/transfers');

    fixture.componentInstance.setFiles([new File(['PDF'], 'valid.pdf', { type: 'application/pdf' })]);
    fixture.detectChanges();

    expect(fixture.componentInstance.rejectedFiles()).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('.upload-panel [role="alert"]')).toBeNull();
    expect((fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).disabled)
      .toBe(false);
  });

  it('displays uploaded file details and a copy action in the confirmation panel', () => {
    signIn();
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    http.expectOne('/api/demo/capabilities').flush({ five_minute_expiry: false });

    fixture.componentInstance.transfer.set({
      id: 'transfer-id',
      share_url: '/share/generated',
      expires_at: '2026-11-25T10:00:00Z',
      files: [{
        id: 'uploaded-id',
        original_name: 'report.pdf',
        mime_type: 'application/pdf',
        size_bytes: 1_500_000,
        uploaded_at: '2026-11-23T10:00:00Z',
      }],
    });
    fixture.componentInstance.shareUrl.set('http://127.0.0.1:8080/share/generated');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.upload-panel--success .file-name')?.textContent)
      .toContain('report.pdf');
    expect(fixture.nativeElement.querySelector('.upload-panel--success .primary-action')?.textContent)
      .toContain('Copier le lien');

    const panel = fixture.nativeElement.querySelector('.upload-panel--success') as HTMLElement;
    const childOrder = Array.from(panel.children).map((child) => child.classList.item(0));
    expect(childOrder).toEqual([
      'panel-title', 'selected-files', 'success-message', 'field-label',
      'share-link', 'primary-action', 'secondary-action',
    ]);
    expect(panel.querySelector('.panel-title')?.textContent).toContain('Ajouter un fichier');
    expect(panel.querySelector('.success-message')?.textContent)
      .toContain('Félicitations, ton fichier sera conservé chez nous pendant une semaine !');
    expect(panel.querySelector('label[for="share-link"]')?.classList.contains('sr-only')).toBe(true);
    expect(panel.querySelector<HTMLInputElement>('#share-link')?.value)
      .toBe('http://127.0.0.1:8080/share/generated');

    expect(fixture.componentInstance.formatSize(512)).toBe('512 octets');
    expect(fixture.componentInstance.formatSize(5400)).toBe('5,4 Ko');
    fixture.componentInstance.expiresInDays.set(2);
    expect(fixture.componentInstance.confirmationMessage())
      .toContain('pendant 2 jours !');
    fixture.componentInstance.demoEnabled.set(true);
    fixture.componentInstance.demoSelected.set(true);
    expect(fixture.componentInstance.confirmationMessage())
      .toContain('pendant 5 minutes !');
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
