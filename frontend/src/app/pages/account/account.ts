import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-account',
  template: `
    <section class="account-card">
      <h1>Mon espace</h1>
      @if (loading()) {
        <p role="status">Vérification de la session...</p>
      } @else {
        @if (auth.user(); as user) {
        <p>Connecté avec l'adresse <strong>{{ user.email }}</strong>.</p>
        <p>La liste de tes fichiers sera disponible avec US05.</p>
        <button type="button" (click)="logout()">Déconnexion</button>
        }
      }
    </section>
  `,
  styles: [`
    :host { display: block; width: min(100%, 36rem); margin: auto; }
    .account-card { padding: 2rem; background: white; border-radius: 8px;
      border: 1px solid #d9d9d9; }
    h1 { font: 700 2rem/1.25 'DM Sans', sans-serif; }
    p { line-height: 1.5; overflow-wrap: anywhere; }
    button { padding: .7rem 1rem; border-radius: 8px;
      border: 1px solid #2c2c2c; background: #2c2c2c; color: white; cursor: pointer; }
  `],
})
export class Account implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(true);

  ngOnInit(): void {
    // Verify the actual bearer token against Laravel, not only the UI guard.
    this.auth.me().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.auth.logout();
        void this.router.navigateByUrl('/login');
      },
    });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
