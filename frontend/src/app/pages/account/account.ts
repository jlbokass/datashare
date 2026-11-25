import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
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
  tags: string[];
}

interface HistoryTransfer {
  id: string;
  share_url: string;
  created_at: string;
  expires_at: string;
  status: 'valid' | 'expired';
  files: HistoryFile[];
}

interface HistoryPagination {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
}

interface HistoryResponse {
  transfers: HistoryTransfer[];
  pagination: HistoryPagination;
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
  readonly page = signal(1);
  readonly pagination = signal<HistoryPagination>({ current_page: 1, per_page: 10, last_page: 1, total: 0 });
  readonly menuOpen = signal(false);
  readonly year = new Date().getFullYear();
  readonly errorMessage = signal<string | null>(null);
  readonly deletingFileId = signal<string | null>(null);
  readonly deletionError = signal<string | null>(null);
  readonly deletionSuccess = signal<string | null>(null);
  readonly savingTagsFileId = signal<string | null>(null);
  readonly tagError = signal<{ fileId: string; message: string } | null>(null);

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

  loadHistory(page = this.page()): void {
    if (this.historyLoading() || this.deletingFileId() || this.savingTagsFileId()) return;
    if (!this.auth.signedIn()) {
      this.endSession('/login');
      return;
    }

    this.historyLoading.set(true);
    this.errorMessage.set(null);
    this.tagError.set(null);
    this.transfers.set([]);
    this.page.set(page);
    const params = new URLSearchParams();
    if (this.historyFilter() !== 'active') params.set('status', this.historyFilter());
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    const url = query ? '/api/transfers?' + query : '/api/transfers';

    this.requests.add(this.http.get<HistoryResponse>(url, {
      headers: this.auth.authorizationHeaders(),
    }).subscribe({
      next: ({ transfers, pagination }) => {
        this.pagination.set(pagination);
        this.historyLoading.set(false);
        if (pagination.current_page > pagination.last_page) {
          this.loadHistory(pagination.last_page);
          return;
        }
        this.transfers.set(transfers);
        this.page.set(pagination.current_page);
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
    if (this.deletingFileId() || this.historyLoading() || this.savingTagsFileId()) return;
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

  addTag(transfer: HistoryTransfer, file: HistoryFile, input: HTMLInputElement): void {
    if (this.historyLoading() || this.deletingFileId() || this.savingTagsFileId()) return;
    const tag = input.value.trim();
    if (!tag || Array.from(tag).length > 30 || file.tags.includes(tag)) {
      const message = !tag ? 'Saisis un tag.' : Array.from(tag).length > 30
        ? 'Un tag ne peut pas dépasser 30 caractères.' : 'Ce tag existe déjà pour ce fichier.';
      this.tagError.set({ fileId: file.id, message });
      return;
    }

    this.saveTags(transfer, file, [...file.tags, tag], input);
  }

  removeTag(transfer: HistoryTransfer, file: HistoryFile, tag: string): void {
    this.saveTags(transfer, file, file.tags.filter((name) => name !== tag));
  }

  private saveTags(transfer: HistoryTransfer, file: HistoryFile, tags: string[], input?: HTMLInputElement): void {
    if (this.historyLoading() || this.deletingFileId() || this.savingTagsFileId()) return;
    if (!this.auth.signedIn()) {
      this.endSession('/login');
      return;
    }

    this.savingTagsFileId.set(file.id);
    this.tagError.set(null);
    const url = `/api/transfers/${encodeURIComponent(transfer.id)}/files/${encodeURIComponent(file.id)}/tags`;
    this.requests.add(this.http.put<{ tags: string[] }>(url, { tags }, {
      headers: this.auth.authorizationHeaders(),
    }).subscribe({
      next: (response) => {
        this.transfers.update((transfers) => transfers.map((current) => current.id !== transfer.id ? current : {
          ...current,
          files: current.files.map((item) => item.id === file.id ? { ...item, tags: response.tags } : item),
        }));
        if (input) input.value = '';
        this.savingTagsFileId.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.savingTagsFileId.set(null);
        if (error.status === 401) {
          this.endSession('/login');
        } else {
          const message = error.status === 404 ? 'Ce fichier est introuvable. Actualise ton historique.'
            : error.status === 422 ? 'Vérifie les tags : 30 caractères maximum, sans doublon.'
            : 'Impossible de modifier les tags. Réessaie plus tard.';
          this.tagError.set({ fileId: file.id, message });
        }
      },
    }));
  }

  refreshHistory(): void {
    this.deletionError.set(null);
    this.loadHistory();
  }

  setHistoryFilter(filter: HistoryFilter): void {
    if (this.historyLoading() || this.deletingFileId() || this.savingTagsFileId()) return;

    if (filter === this.historyFilter()) return;
    this.historyFilter.set(filter);
    this.loadHistory(1);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.pagination().last_page || page === this.page()) return;
    this.loadHistory(page);
  }

  formatSize(bytes: number): string {
    const divisor = bytes >= 1_000_000_000 ? 1_000_000_000 : bytes >= 1_000_000 ? 1_000_000 : bytes >= 1_000 ? 1_000 : 1;
    const unit = divisor === 1_000_000_000 ? 'Go' : divisor === 1_000_000 ? 'Mo' : divisor === 1_000 ? 'Ko' : 'octets';
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(bytes / divisor) + ' ' + unit;
  }

  formatDate(iso: string): string {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  }

  formatExpiry(iso: string, status: HistoryTransfer['status']): string {
    const expiry = new Date(iso);
    if (status === 'expired' || expiry.getTime() <= Date.now()) {
      return `Expiré le ${this.formatDate(iso)}`;
    }

    const today = new Date();
    const expiryDay = Date.UTC(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
    const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const days = Math.round((expiryDay - todayDay) / 86_400_000);
    const hour = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(expiry);

    return days === 0
      ? `Expire aujourd’hui à ${hour}`
      : `Expire dans ${days} jour${days > 1 ? 's' : ''} à ${hour}`;
  }

  logout(): void {
    this.endSession('/');
  }

  private endSession(destination: string): void {
    this.requests.unsubscribe();
    this.transfers.set([]);
    this.page.set(1);
    this.pagination.set({ current_page: 1, per_page: 10, last_page: 1, total: 0 });
    this.historyLoading.set(false);
    this.loading.set(false);
    this.deletingFileId.set(null);
    this.deletionError.set(null);
    this.deletionSuccess.set(null);
    this.savingTagsFileId.set(null);
    this.tagError.set(null);
    this.auth.logout();
    void this.router.navigateByUrl(destination);
  }
}
