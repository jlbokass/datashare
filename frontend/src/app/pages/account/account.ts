import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

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
  readonly includeExpired = signal(false);
  readonly errorMessage = signal<string | null>(null);

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
    if (this.historyLoading()) return;
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

  toggleExpired(event: Event): void {
    this.includeExpired.set((event.target as HTMLInputElement).checked);
    this.loadHistory();
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
    this.auth.logout();
    void this.router.navigateByUrl(destination);
  }
}
