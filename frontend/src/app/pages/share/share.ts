import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface PublicFile {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
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

  readonly loading = signal(true);
  readonly share = signal<PublicShare | null>(null);
  readonly errorMessage = signal<string | null>(null);

  private readonly token = signal<string | null>(null);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const token = params.get('token');

      this.share.set(null);
      this.errorMessage.set(null);
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
            this.errorMessage.set('Ce lien de partage a expiré.');
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

    if (days === 0) return `${subject} aujourd’hui.`;
    if (days === 1) return `${subject} demain.`;
    return `${subject} dans ${days} jours.`;
  }

  formatDate(iso: string): string {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
      .format(new Date(iso));
  }

  hasZip(files: PublicFile[]): boolean {
    return files.some((file) => file.original_name.toLowerCase().endsWith('.zip'));
  }
}
