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
    const allFilter = fixture.nativeElement.querySelector('.history-filters button:first-child') as HTMLButtonElement;
    const activeFilter = fixture.nativeElement.querySelector('.history-filters button:nth-child(2)') as HTMLButtonElement;
    expect(activeFilter.getAttribute('aria-pressed')).toBe('true');
    allFilter.click();

    const request = http.expectOne('/api/transfers?include_expired=true');
    expect(request.request.headers.get('Authorization')).toBe('Bearer memory.jwt.signature');
    request.flush({ transfers: [{ ...transfer, status: 'expired' }] });
    expect(text()).toContain('Expiré');
    expect(fixture.nativeElement.querySelector('a[href="' + transfer.share_url + '"]')).toBeNull();

    activeFilter.click();
    http.expectOne('/api/transfers').flush({ transfers: [] });
    expect(text()).toContain('Aucun transfert actif');
  });

  it('filters expired transfers locally after loading all statuses', () => {
    openHistory().flush({ transfers: [transfer] });
    fixture.detectChanges();

    const allFilter = fixture.nativeElement.querySelector('.history-filters button:first-child') as HTMLButtonElement;
    const expiredFilter = fixture.nativeElement.querySelector('.history-filters button:nth-child(3)') as HTMLButtonElement;
    allFilter.click();
    http.expectOne('/api/transfers?include_expired=true').flush({
      transfers: [transfer, { ...transfer, id: 'expired-transfer', status: 'expired' }],
    });

    expiredFilter.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.transfer')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Expiré');
    http.expectNone('/api/transfers?include_expired=true');
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

  describe('individual deletion', () => {
    beforeEach(() => {
      openHistory().flush({ transfers: [transfer] });
      fixture.detectChanges();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
    });

    afterEach(() => vi.mocked(window.confirm).mockRestore());

    function deleteButton(): HTMLButtonElement {
      return fixture.nativeElement.querySelector('button[aria-label="Supprimer report.pdf"]');
    }

    const deleteUrl = '/api/transfers/transfer-id/files/file-one';

    it('requires confirmation naming the file and cancellation sends no DELETE', () => {
      vi.mocked(window.confirm).mockReturnValue(false);
      deleteButton().click();

      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('report.pdf'));
      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('irréversible'));
      http.expectNone((request) => request.method === 'DELETE');
      expect(text()).toContain('report.pdf');
      expect(text()).toContain('archive.zip');
    });

    it('sends the file URL and memory bearer, then refreshes while preserving the other file and link', () => {
      deleteButton().click();
      const request = http.expectOne(deleteUrl);
      expect(request.request.method).toBe('DELETE');
      expect(request.request.headers.get('Authorization')).toBe('Bearer memory.jwt.signature');
      request.flush(null, { status: 204, statusText: 'No Content' });

      const refresh = http.expectOne('/api/transfers');
      expect(refresh.request.headers.get('Authorization')).toBe('Bearer memory.jwt.signature');
      refresh.flush({ transfers: [{ ...transfer, files: [transfer.files[1]] }] });
      expect(text()).toContain('report.pdf » a été supprimé');
      expect(text()).toContain('archive.zip');
      expect(fixture.nativeElement.querySelector('button[aria-label="Supprimer report.pdf"]')).toBeNull();
      expect(fixture.nativeElement.querySelector('a[href="' + transfer.share_url + '"]')).not.toBeNull();
    });

    it('prevents duplicate deletion and disables file actions while pending', () => {
      deleteButton().click();
      const current = fixture.componentInstance.transfers()[0];
      fixture.componentInstance.deleteFile(current, current.files[0]);
      const request = http.expectOne(deleteUrl);
      expect(window.confirm).toHaveBeenCalledTimes(1);
      fixture.detectChanges();
      expect(deleteButton().disabled).toBe(true);
      expect(fixture.nativeElement.querySelector('.history-filters button').disabled).toBe(true);
      request.flush(null, { status: 204, statusText: 'No Content' });
      http.expectOne('/api/transfers').flush({ transfers: [] });
    });

    it.each([404, 500])('keeps files visible and allows a confirmed retry after HTTP %i', (status) => {
      deleteButton().click();
      http.expectOne(deleteUrl).flush({ message: '/private/path' }, { status, statusText: 'Failure' });
      http.expectNone('/api/transfers');
      expect(text()).toContain('report.pdf');
      expect(text()).toContain('archive.zip');
      expect(text()).not.toContain('/private/path');
      expect(text()).not.toContain('a été supprimé');
      expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
      expect(deleteButton().disabled).toBe(false);
      expect(auth.signedIn()).toBe(true);
      deleteButton().click();
      expect(window.confirm).toHaveBeenCalledTimes(2);
      http.expectOne(deleteUrl).flush(null, { status: 204, statusText: 'No Content' });
      http.expectOne('/api/transfers').flush({ transfers: [] });
    });

    it('keeps the session and files on a network failure', () => {
      deleteButton().click();
      http.expectOne(deleteUrl).error(new ProgressEvent('error'));
      expect(text()).toContain('Impossible de supprimer');
      expect(auth.signedIn()).toBe(true);
      expect(text()).toContain('archive.zip');
    });

    it('ends the session on deletion 401 without requesting a refresh', () => {
      deleteButton().click();
      http.expectOne(deleteUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
      http.expectNone('/api/transfers');
      expect(auth.signedIn()).toBe(false);
      expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/login');
      expect(text()).not.toContain('archive.zip');
    });

    it('shows empty history after the last file is deleted and preserves the expiry filter', () => {
      const allFilter = fixture.nativeElement.querySelector('.history-filters button:first-child') as HTMLButtonElement;
      allFilter.click();
      http.expectOne('/api/transfers?include_expired=true')
        .flush({ transfers: [{ ...transfer, status: 'expired', files: [transfer.files[0]] }] });
      fixture.detectChanges();
      deleteButton().click();
      http.expectOne(deleteUrl).flush(null, { status: 204, statusText: 'No Content' });
      http.expectOne('/api/transfers?include_expired=true').flush({ transfers: [] });
      expect(text()).toContain('a été supprimé');
      expect(text()).toContain('Aucun transfert dans ton historique');
      expect(fixture.nativeElement.querySelector('a[href="' + transfer.share_url + '"]')).toBeNull();
    });

    it('distinguishes successful deletion from failure to refresh history', () => {
      deleteButton().click();
      http.expectOne(deleteUrl).flush(null, { status: 204, statusText: 'No Content' });
      http.expectOne('/api/transfers').flush({}, { status: 500, statusText: 'Server Error' });
      expect(text()).toContain('a été supprimé');
      expect(text()).toContain('Impossible de charger');
      expect(text()).toContain('Réessayer');
    });

    it('cancels the pending subscription when leaving the account page', () => {
      deleteButton().click();
      const request = http.expectOne(deleteUrl);
      fixture.destroy();
      expect(request.cancelled).toBe(true);
    });
  });

});
