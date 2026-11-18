import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-share-pending',
  imports: [RouterLink],
  template: `
    <section class="pending-card">
      <h1>Lien de partage créé</h1>
      <p>Ce transfert a reçu un lien unique.</p>
      <p>Le téléchargement public sera disponible à l'issue de US02.</p>
      <a routerLink="/">Retour à l'accueil</a>
    </section>
  `,
  styles: [`
    :host { display: block; width: min(100%, 28rem); margin: auto; }
    .pending-card { padding: 2rem; border: 1px solid #d9d9d9; border-radius: 8px; background: #fff; }
    h1 { font: 700 1.75rem/1.3 'DM Sans', sans-serif; }
    p { font: 400 1rem/1.5 'Inter', sans-serif; }
    a { color: #7a3409; }
  `],
})
export class SharePending {}
