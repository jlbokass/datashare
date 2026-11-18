import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { Account } from './account';

describe('Account — personal history', () => {
  const user = { id: 'owner-id', email: 'owner@example.com', created_at: '2026-11-18T10:00:00Z' };
  const transfer = {
    id: 'transfer-id', share_url: '/share/' + 'a'.repeat(64),
    created_at: '2026-11-18T10:00:00Z', expires_at: '2026-11-25T10:00:00Z', status: 'valid',
    files: [
      { id: 'file-one', original_name: 'report.pdf', size_bytes: 1_000_000, mime_type: 'application/pdf', uploaded_at: '2026-11-18T10:00:00Z' },
      { id: 'file-two', original_name: 'archive.zip', size_bytes: 512, mime_type: 'application/zip', uploaded_at: '2026-11-18T11:00:00Z' },
    ],
  };
  let fixture: ComponentFixture<Account>;
  let http: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Account],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    auth.login(user.email, 'StrongPass123!').subscribe();
    http.expectOne('/api/auth/login').flush({ access_token: 'memory.jwt.signature', token_type: 'Bearer', user });
    fixture = TestBed.createComponent(Account);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function openHistory() {
    const session = http.expectOne('/api/auth/me');
    expect(session.request.headers.get('Authorization')).toBe('Bearer memory.jwt.signature');
    session.flush({ user });
    fixture.detectChanges();
    return http.expectOne('/api/transfers');
  }

  function text(): string {
    fixture.detectChanges();
    return fixture.nativeElement.textContent;
  }

  it('loads history with the memory JWT and renders every file with metadata and status', () => {
    const request = openHistory();
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer memory.jwt.signature');
    expect(text()).toContain('Chargement');
    request.flush({ transfers: [transfer] });

    expect(text()).toContain('report.pdf');
    expect(text()).toContain('archive.zip');
    expect(text()).toContain('1 Mo');
    expect(text()).toContain('512 octets');
    expect(text()).toContain('Valide');
    const times = Array.from(fixture.nativeElement.querySelectorAll('time')) as HTMLTimeElement[];
    expect(times.map((time) => time.dateTime)).toContain(transfer.files[1].uploaded_at);
    expect(times.map((time) => time.dateTime)).toContain(transfer.expires_at);
    expect(fixture.nativeElement.querySelector('a[href="' + transfer.share_url + '"]')).not.toBeNull();
    expect(text()).not.toContain('US05');
  });

  it('explains an empty active history and offers an upload link', () => {
    openHistory().flush({ transfers: [] });

    expect(text()).toContain('Aucun transfert actif');
    expect(fixture.nativeElement.querySelector('a[href="/"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('opts into expired history and renders an expired link without an active share anchor', () => {
    openHistory().flush({ transfers: [] });
    fixture.detectChanges();
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));

    const request = http.expectOne('/api/transfers?include_expired=true');
    expect(request.request.headers.get('Authorization')).toBe('Bearer memory.jwt.signature');
    request.flush({ transfers: [{ ...transfer, status: 'expired' }] });
    expect(text()).toContain('Expiré');
    expect(fixture.nativeElement.querySelector('a[href="' + transfer.share_url + '"]')).toBeNull();

    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    http.expectOne('/api/transfers').flush({ transfers: [] });
    expect(text()).toContain('Aucun transfert actif');
  });

  it('shows a safe error and retries without clearing the session on server failure', () => {
    openHistory().flush({ message: '/private/storage/path' }, { status: 500, statusText: 'Server Error' });

    expect(text()).toContain('Impossible de charger');
    expect(text()).not.toContain('/private/storage/path');
    expect(auth.signedIn()).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    const retry = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('Réessayer')) as HTMLButtonElement;
    retry.click();
    http.expectOne('/api/transfers').flush({ transfers: [transfer] });
    expect(text()).toContain('report.pdf');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('shows a retryable error on a network failure', () => {
    openHistory().error(new ProgressEvent('error'));

    expect(text()).toContain('Impossible de charger');
    expect(text()).toContain('Réessayer');
    expect(auth.signedIn()).toBe(true);
  });

  it('clears the memory session and redirects when the history request returns 401', () => {
    openHistory().flush({ code: 'unauthenticated' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.signedIn()).toBe(false);
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/login');
    expect(text()).not.toContain(user.email);
  });

  it('does not request history if session verification fails', () => {
    http.expectOne('/api/auth/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectNone('/api/transfers');

    expect(auth.signedIn()).toBe(false);
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('cancels pending history requests when the page is destroyed', () => {
    const request = openHistory();
    fixture.destroy();

    expect(request.cancelled).toBe(true);
  });

  it('cancels pending requests and hides account data on logout', () => {
    const request = openHistory();
    fixture.componentInstance.logout();

    expect(request.cancelled).toBe(true);
    expect(auth.signedIn()).toBe(false);
    expect(text()).not.toContain(user.email);
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/');
  });
});
