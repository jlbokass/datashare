import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface PublicFile {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
  password_protected: boolean;
}

interface PublicShare {
  expires_at: string;
  files: PublicFile[];
}

@Component({
  selector: 'app-share',
  imports: [RouterLink],
  templateUrl: './share.html',
  styleUrl: './share.scss',
})
export class Share {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly share = signal<PublicShare | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly expired = signal(false);
  readonly authorizingFile = signal<string | null>(null);
  readonly passwordError = signal<{ fileId: string; message: string } | null>(null);

  private readonly token = signal<string | null>(null);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const token = params.get('token');

      this.share.set(null);
      this.errorMessage.set(null);
      this.expired.set(false);
      this.authorizingFile.set(null);
      this.passwordError.set(null);
      this.loading.set(true);
      this.token.set(token);

      if (!token || !/^[a-f0-9]{64}$/.test(token)) {
        this.errorMessage.set('Ce lien de partage est invalide ou introuvable.');
        this.loading.set(false);

        return;
      }

      this.http.get<{ share: PublicShare }>(`/api/shares/${encodeURIComponent(token)}`).subscribe({
        next: ({ share }) => {
          this.share.set(share);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 410) {
            this.expired.set(true);
            this.errorMessage.set("Ce fichier n'est plus disponible en téléchargement car il a expiré.");
          } else if (error.status === 404) {
            this.errorMessage.set('Ce lien de partage est introuvable.');
          } else {
            this.errorMessage.set('Impossible de charger le transfert. Réessaie plus tard.');
          }

          this.loading.set(false);
        },
      });
    });
  }

  downloadUrl(fileId: string): string {
    return `/api/shares/${encodeURIComponent(this.token() ?? '')}/files/${encodeURIComponent(fileId)}`;
  }

  authorizeDownload(file: PublicFile, input: HTMLInputElement): void {
    if (this.authorizingFile() || !file.password_protected) return;
    const password = input.value;
    if (!password.trim() || Array.from(password).length < 6 || new TextEncoder().encode(password).length > 72) {
      this.passwordError.set({ fileId: file.id, message: 'Saisis le mot de passe du fichier (6 caractères minimum).' });
      return;
    }

    const token = this.token();
    const url = this.downloadUrl(file.id);
    this.authorizingFile.set(file.id);
    this.passwordError.set(null);
    this.http.post<{ download_url: string }>(url + '/authorize', { password })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: ({ download_url }) => {
          if (token !== this.token()) return;
          this.authorizingFile.set(null);
          if (!download_url.startsWith(url + '?')) {
            this.passwordError.set({ fileId: file.id, message: 'Le lien de téléchargement est invalide.' });
            return;
          }
          input.value = '';
          // Keep large downloads in the browser's native streaming download path.
          this.startDownload(download_url);
        },
        error: (error: HttpErrorResponse) => {
          if (token !== this.token()) return;
          this.authorizingFile.set(null);
          const message = error.status === 403 ? 'Mot de passe incorrect.'
            : error.status === 429 ? 'Trop de tentatives. Réessaie dans une minute.'
            : error.status === 410 ? 'Ce lien de partage a expiré.'
            : error.status === 404 ? 'Ce fichier est introuvable.'
            : error.status === 422 ? 'Vérifie le mot de passe saisi.'
            : 'Impossible de télécharger ce fichier. Réessaie plus tard.';
          this.passwordError.set({ fileId: file.id, message });
        },
      });
  }

  private startDownload(url: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  formatSize(bytes: number): string {
    const divisor = bytes >= 1_000_000_000 ? 1_000_000_000
      : bytes >= 1_000_000 ? 1_000_000
      : bytes >= 1_000 ? 1_000 : 1;
    const unit = divisor === 1_000_000_000 ? 'Go'
      : divisor === 1_000_000 ? 'Mo'
      : divisor === 1_000 ? 'Ko' : 'octet' + (bytes > 1 ? 's' : '');

    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(bytes / divisor) + ' ' + unit;
  }

  expiryNotice(iso: string, fileCount: number): string {
    const expiry = new Date(iso);
    const today = new Date();
    const expiryDay = Date.UTC(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
    const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const days = Math.max(0, Math.round((expiryDay - todayDay) / 86_400_000));
    const subject = fileCount === 1 ? 'Ce fichier expirera' : 'Ces fichiers expireront';
    const time = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(expiry);

    if (days === 0) return `${subject} aujourd’hui à ${time}.`;
    if (days === 1) return `${subject} demain à ${time}.`;
    return `${subject} dans ${days} jours à ${time}.`;
  }

  formatDate(iso: string): string {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
      .format(new Date(iso));
  }

  hasZip(files: PublicFile[]): boolean {
    return files.some((file) => file.original_name.toLowerCase().endsWith('.zip'));
  }
}
