import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { HomeNavigation } from './pages/home-navigation';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly homeNavigation = inject(HomeNavigation);
  readonly year = new Date().getFullYear();

  resetHome(): void {
    this.homeNavigation.requestReset();
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
