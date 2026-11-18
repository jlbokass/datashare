import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';

export interface PublicUser {
  id: string;
  email: string;
  created_at: string;
}

interface UserEnvelope {
  user: PublicUser;
}

interface LoginResponse extends UserEnvelope {
  access_token: string;
  token_type: 'Bearer';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  // Store the JWT in memory only: no localStorage, sessionStorage or cookie.
  // Refreshing the page requires signing in again during the US04 MVP.
  private readonly token = signal<string | null>(null);
  private readonly currentUser = signal<PublicUser | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly signedIn = computed(() => this.token() !== null);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap(({ access_token, user }) => {
        this.token.set(access_token);
        this.currentUser.set(user);
      }),
    );
  }

  me(): Observable<UserEnvelope> {
    const accessToken = this.token();

    if (!accessToken) {
      return throwError(() => new Error('Aucune session en cours.'));
    }

    return this.http.get<UserEnvelope>('/api/auth/me', {
      headers: new HttpHeaders({ Authorization: `Bearer ${accessToken}` }),
    }).pipe(
      tap(({ user }) => this.currentUser.set(user)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.logout();
        }
        return throwError(() => error);
      }),
    );
  }

  logout(): void {
    // Local logout only: JWT remains valid until expiry (no revocation in US04).
    this.token.set(null);
    this.currentUser.set(null);
  }
}
