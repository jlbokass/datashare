import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Share } from './share';

describe('Share — public file access', () => {
  const token = 'a'.repeat(64);
  let http: HttpTestingController;
  let fixture: ComponentFixture<Share>;

  function createPage(selectedToken: string | null = token): Share {
    TestBed.configureTestingModule({
      imports: [Share],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ token: selectedToken })) } },
      ],
    });

    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(Share);
    return fixture.componentInstance;
  }

  afterEach(() => {
    http?.verify();
    TestBed.resetTestingModule();
  });

  it('loads metadata without a JWT and builds one download link per file', () => {
    const component = createPage();

    const request = http.expectOne(`/api/shares/${token}`);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.has('Authorization')).toBe(false);

    request.flush({
      share: {
        expires_at: '2026-11-25T10:00:00Z',
        files: [
          { id: '550e8400-e29b-41d4-a716-446655440000', original_name: 'report.pdf', mime_type: 'application/pdf', size_bytes: 256, uploaded_at: '2026-11-18T10:00:00Z' },
          { id: '550e8400-e29b-41d4-a716-446655440001', original_name: 'archive.zip', mime_type: 'application/zip', size_bytes: 2048, uploaded_at: '2026-11-18T10:00:00Z' },
        ],
      },
    });

    expect(component.loading()).toBe(false);
    expect(component.share()?.files).toHaveLength(2);
    expect(component.downloadUrl('550e8400-e29b-41d4-a716-446655440000'))
      .toBe(`/api/shares/${token}/files/550e8400-e29b-41d4-a716-446655440000`);
    expect(component.hasZip(component.share()?.files ?? [])).toBe(true);
  });

  it('renders the direct-download Figma order for a single file', () => {
    const page = createPage();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    const file = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      original_name: 'report.pdf',
      mime_type: 'application/pdf',
      size_bytes: 2_600_000,
      uploaded_at: '2026-11-18T10:00:00Z',
    };

    http.expectOne(`/api/shares/${token}`).flush({
      share: { expires_at: tomorrow.toISOString(), files: [file] },
    });
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.share-card') as HTMLElement;
    expect(Array.from(card.children).map(child => child.tagName)).toEqual(['H1', 'UL', 'P', 'DIV']);
    expect(card.querySelector('h1')?.textContent).toContain('Télécharger un fichier');
    expect(card.querySelector('.file-details strong')?.textContent).toContain('report.pdf');
    expect(card.querySelector('.file-details small')?.textContent).toContain('2,6 Mo');
    expect(card.querySelector('.expiry-notice')?.textContent).toContain('Ce fichier expirera demain.');
    expect(card.querySelector('.share-summary')).toBeNull();
    expect(card.querySelector('.home-link')).toBeNull();
    const download = card.querySelector('a.download-link') as HTMLAnchorElement;
    expect(download.getAttribute('aria-label')).toBe('Télécharger report.pdf');
    expect(download.getAttribute('href')).toBe(page.downloadUrl(file.id));
    expect(download.querySelector('svg')).not.toBeNull();
    expect(download.textContent).toContain('Télécharger');

    expect(page.formatSize(512)).toBe('512 octets');
    expect(page.formatSize(2_048)).toBe('2 Ko');
  });

  it('keeps an individual download action for every file in a public transfer', () => {
    createPage();
    const files = [
      { id: 'first', original_name: 'one.pdf', mime_type: 'application/pdf', size_bytes: 2_000_000, uploaded_at: '2026-11-18T10:00:00Z' },
      { id: 'second', original_name: 'two.pdf', mime_type: 'application/pdf', size_bytes: 3_000_000, uploaded_at: '2026-11-18T10:00:00Z' },
    ];
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 3);
    http.expectOne(`/api/shares/${token}`).flush({
      share: { expires_at: expiry.toISOString(), files },
    });
    fixture.detectChanges();

    const links = Array.from(fixture.nativeElement.querySelectorAll('a.download-link')) as HTMLAnchorElement[];
    expect(links.map(link => link.getAttribute('aria-label'))).toEqual([
      'Télécharger one.pdf', 'Télécharger two.pdf',
    ]);
    expect(fixture.nativeElement.querySelector('.expiry-notice')?.textContent)
      .toContain('Ces fichiers expireront dans 3 jours.');
  });

  it('shows expiration error for HTTP 410', () => {
    const component = createPage();

    http.expectOne(`/api/shares/${token}`)
      .flush({ message: 'Ce lien de partage a expiré.', code: 'share_expired' }, {
        status: 410, statusText: 'Gone',
      });

    expect(component.errorMessage())
      .toBe("Ce fichier n'est plus disponible en téléchargement car il a expiré.");
    expect(component.expired()).toBe(true);
    expect(component.loading()).toBe(false);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.share-card') as HTMLElement;
    expect(Array.from(card.children).map(child => child.tagName)).toEqual(['H1', 'P']);
    expect(card.querySelector('.expired-notice[role="alert"]')?.textContent)
      .toContain("Ce fichier n'est plus disponible en téléchargement car il a expiré.");
    expect(card.querySelector('.expired-notice svg')).not.toBeNull();
    expect(card.querySelector('.download-link')).toBeNull();
    expect(card.querySelector('.home-link')).toBeNull();
  });

  it('shows not found for HTTP 404', () => {
    const component = createPage();

    http.expectOne(`/api/shares/${token}`)
      .flush({ message: 'Ce lien est introuvable.', code: 'not_found' }, {
        status: 404, statusText: 'Not Found',
      });

    expect(component.errorMessage()).toContain('introuvable');
    expect(component.expired()).toBe(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain('Lien indisponible');
    expect(fixture.nativeElement.querySelector('.home-link')).not.toBeNull();
  });

  it('rejects a malformed token without contacting Laravel', () => {
    const component = createPage('bad-token');

    expect(component.errorMessage()).toContain('invalide');
    expect(http.match('/api/shares/bad-token')).toHaveLength(0);
  });
});
