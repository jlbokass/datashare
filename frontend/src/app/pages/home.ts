import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="welcome" aria-labelledby="welcome-title">
      <h1 id="welcome-title">Tu veux partager un fichier ?</h1>
      <p>Crée ton compte pour préparer tes futurs transferts.</p>
      <a class="welcome-action" routerLink="/register">Créer un compte</a>
    </section>
  `,
  styles: [`
    .welcome { text-align: center; max-width: 38rem; margin: auto; }
    h1 { font: 700 2rem/1.25 'DM Sans', sans-serif; margin-bottom: 1rem; }
    p { line-height: 1.5; margin-bottom: 1.5rem; }
    .welcome-action { display: inline-block; padding: .85rem 1.5rem;
      border-radius: 8px; background: #2c2c2c; color: #fff;
      font-weight: 600; text-decoration: none; }
    .welcome-action:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
  `],
})
export class Home {}
