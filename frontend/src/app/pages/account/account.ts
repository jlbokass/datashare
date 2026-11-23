import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

type HistoryFilter = 'all' | 'active' | 'expired';

interface HistoryFile {
  id: string;
  original_name: string;
  size_bytes: number;
  mime_type: string;
  uploaded_at: string;
}

interface HistoryTransfer {
  id: string;
  share_url: string;
  created_at: string;
  expires_at: string;
  status: 'valid' | 'expired';
  files: HistoryFile[];
}

@Component({
  selector: 'app-account',
  imports: [RouterLink],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly requests = new Subscription();

  readonly loading = signal(true);
  readonly historyLoading = signal(false);
  readonly transfers = signal<HistoryTransfer[]>([]);
  readonly historyFilter = signal<HistoryFilter>('active');
  readonly includeExpired = computed(() => this.historyFilter() !== 'active');
  readonly visibleTransfers = computed(() => this.historyFilter() === 'expired'
    ? this.transfers().filter((transfer) => transfer.status === 'expired')
    : this.historyFilter() === 'active'
      ? this.transfers().filter((transfer) => transfer.status === 'valid')
      : this.transfers());
  readonly menuOpen = signal(false);
  readonly year = new Date().getFullYear();
  readonly errorMessage = signal<string | null>(null);
  readonly deletingFileId = signal<string | null>(null);
  readonly deletionError = signal<string | null>(null);
  readonly deletionSuccess = signal<string | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.requests.unsubscribe());
  }

  ngOnInit(): void {
    // Verify the actual bearer token against Laravel, not only the UI guard.
    this.requests.add(this.auth.me().subscribe({
      next: () => {
        this.loading.set(false);
        this.loadHistory();
      },
      error: () => this.endSession('/login'),
    }));
  }

  loadHistory(): void {
    if (this.historyLoading() || this.deletingFileId()) return;
    if (!this.auth.signedIn()) {
      this.endSession('/login');
      return;
    }

    this.historyLoading.set(true);
    this.errorMessage.set(null);
    this.transfers.set([]);
    const url = this.includeExpired() ? '/api/transfers?include_expired=true' : '/api/transfers';

    this.requests.add(this.http.get<{ transfers: HistoryTransfer[] }>(url, {
      headers: this.auth.authorizationHeaders(),
    }).subscribe({
      next: ({ transfers }) => {
        this.transfers.set(transfers);
        this.historyLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.historyLoading.set(false);
        if (error.status === 401) {
          this.endSession('/login');
        } else {
          this.errorMessage.set('Impossible de charger ton historique. Réessaie plus tard.');
        }
      },
    }));
  }

  deleteFile(transfer: HistoryTransfer, file: HistoryFile): void {
    if (this.deletingFileId() || this.historyLoading()) return;
    if (!this.auth.signedIn()) {
      this.endSession('/login');
      return;
    }
    if (!window.confirm(`Supprimer définitivement « ${file.original_name} » ? Cette action est irréversible.`)) return;

    this.deletingFileId.set(file.id);
    this.deletionError.set(null);
    this.deletionSuccess.set(null);
    const url = `/api/transfers/${encodeURIComponent(transfer.id)}/files/${encodeURIComponent(file.id)}`;

    this.requests.add(this.http.delete<void>(url, {
      headers: this.auth.authorizationHeaders(),
    }).subscribe({
      next: () => {
        this.deletingFileId.set(null);
        this.deletionSuccess.set(`« ${file.original_name} » a été supprimé.`);
        this.loadHistory();
      },
      error: (error: HttpErrorResponse) => {
        this.deletingFileId.set(null);
        if (error.status === 401) {
          this.endSession('/login');
        } else {
          this.deletionError.set(error.status === 404
            ? 'Ce fichier est introuvable ou n’est plus disponible. Actualise ton historique.'
            : 'Impossible de supprimer ce fichier. Réessaie plus tard.');
        }
      },
    }));
  }

  refreshHistory(): void {
    this.deletionError.set(null);
    this.loadHistory();
  }

  setHistoryFilter(filter: HistoryFilter): void {
    if (this.historyLoading() || this.deletingFileId()) return;

    const wasIncludingExpired = this.includeExpired();
    this.historyFilter.set(filter);
    if (wasIncludingExpired !== this.includeExpired()) this.loadHistory();
  }

  formatSize(bytes: number): string {
    const divisor = bytes >= 1_000_000_000 ? 1_000_000_000 : bytes >= 1_000_000 ? 1_000_000 : bytes >= 1_000 ? 1_000 : 1;
    const unit = divisor === 1_000_000_000 ? 'Go' : divisor === 1_000_000 ? 'Mo' : divisor === 1_000 ? 'Ko' : 'octets';
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(bytes / divisor) + ' ' + unit;
  }

  formatDate(iso: string): string {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  }

  logout(): void {
    this.endSession('/');
  }

  private endSession(destination: string): void {
    this.requests.unsubscribe();
    this.transfers.set([]);
    this.historyLoading.set(false);
    this.loading.set(false);
    this.deletingFileId.set(null);
    this.deletionError.set(null);
    this.deletionSuccess.set(null);
    this.auth.logout();
    void this.router.navigateByUrl(destination);
  }
}
