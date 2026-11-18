import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Share } from './share';

describe('Share — public file access', () => {
  const token = 'a'.repeat(64);
  let http: HttpTestingController;

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

    return TestBed.createComponent(Share).componentInstance;
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

  it('shows expiration error for HTTP 410', () => {
    const component = createPage();

    http.expectOne(`/api/shares/${token}`)
      .flush({ message: 'Ce lien de partage a expiré.', code: 'share_expired' }, {
        status: 410, statusText: 'Gone',
      });

    expect(component.errorMessage()).toContain('expiré');
    expect(component.loading()).toBe(false);
  });

  it('shows not found for HTTP 404', () => {
    const component = createPage();

    http.expectOne(`/api/shares/${token}`)
      .flush({ message: 'Ce lien est introuvable.', code: 'not_found' }, {
        status: 404, statusText: 'Not Found',
      });

    expect(component.errorMessage()).toContain('introuvable');
  });

  it('rejects a malformed token without contacting Laravel', () => {
    const component = createPage('bad-token');

    expect(component.errorMessage()).toContain('invalide');
    expect(http.match('/api/shares/bad-token')).toHaveLength(0);
  });
});
