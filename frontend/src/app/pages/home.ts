import { HttpClient, HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

interface UploadedFile {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
}

interface Transfer {
  id: string;
  share_url: string;
  expires_at: string;
  files: UploadedFile[];
}

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);

  readonly files = signal<File[]>([]);
  readonly expiresInDays = signal(7);
  readonly busy = signal(false);
  readonly progress = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly copied = signal(false);
  readonly transfer = signal<Transfer | null>(null);
  readonly shareUrl = signal<string | null>(null);

  private readonly maxFileBytes = 1_000_000_000;
  private readonly maxTotalBytes = 2_000_000_000;
  private readonly allowedExtensions = new Set([
    'pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'txt', 'mp3', 'mp4', 'zip',
  ]);

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();

    if (!this.busy()) {
      this.setFiles(Array.from(event.dataTransfer?.files ?? []));
    }
  }

  setFiles(files: File[]): void {
    this.transfer.set(null);
    this.shareUrl.set(null);
    this.copied.set(false);
    this.errorMessage.set(null);

    if (files.length > 5) {
      this.files.set([]);
      this.errorMessage.set('Tu peux envoyer jusqu’à 5 fichiers par transfert.');
      return;
    }

    if (files.some((file) => file.size > this.maxFileBytes)) {
      this.files.set([]);
      this.errorMessage.set('La taille de chaque fichier est limitée à 1 Go.');
      return;
    }

    if (files.reduce((total, file) => total + file.size, 0) > this.maxTotalBytes) {
      this.files.set([]);
      this.errorMessage.set('La taille totale est limitée à 2 Go.');
      return;
    }

    if (files.some((file) => !this.allowedExtensions.has(file.name.split('.').pop()?.toLowerCase() ?? ''))) {
      this.files.set([]);
      this.errorMessage.set('Type de fichier non autorisé. Consulte les formats acceptés.');
      return;
    }

    this.files.set(files);
  }

  removeFile(index: number): void {
    if (this.busy()) {
      return;
    }

    this.files.update((previous) => previous.filter((_, i) => i !== index));
    this.errorMessage.set(null);
  }

  changeExpiry(event: Event): void {
    this.expiresInDays.set(Number((event.target as HTMLSelectElement).value));
  }

  formatSize(bytes: number): string {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(bytes / 1_000_000) + ' Mo';
  }

  upload(): void {
    if (!this.auth.signedIn() || this.files().length === 0 || this.busy()) {
      return;
    }

    const body = new FormData();

    for (const file of this.files()) {
      body.append('files[]', file, file.name);
    }

    body.append('expires_in_days', String(this.expiresInDays()));
    this.errorMessage.set(null);
    this.busy.set(true);
    this.progress.set(null);

    this.http.post<{ transfer: Transfer }>('/api/transfers', body, {
      headers: this.auth.authorizationHeaders(),
      observe: 'events',
      reportProgress: true,
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.progress.set(Math.round(100 * event.loaded / event.total));
        }

        if (event.type === HttpEventType.Response && event.body) {
          this.transfer.set(event.body.transfer);
          this.shareUrl.set(window.location.origin + event.body.transfer.share_url);
          this.busy.set(false);
          this.progress.set(100);
        }
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.auth.logout();
          this.errorMessage.set('Ta session a expiré. Connecte-toi à nouveau.');
        } else if (error.status === 413 || error.status === 422) {
          this.errorMessage.set(error.error?.message || 'Vérifie les fichiers sélectionnés.');
        } else {
          this.errorMessage.set('Échec du téléversement. Réessaie.');
        }

        this.busy.set(false);
        this.progress.set(null);
      },
    });
  }

  async copyLink(): Promise<void> {
    const link = this.shareUrl();

    if (!link) {
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      this.copied.set(true);
    } catch {
      this.errorMessage.set('La copie automatique est indisponible. Sélectionne le lien pour le copier.');
    }
  }

  reset(): void {
    if (this.busy()) {
      return;
    }

    this.files.set([]);
    this.transfer.set(null);
    this.shareUrl.set(null);
    this.errorMessage.set(null);
    this.progress.set(null);
    this.copied.set(false);
  }
}
