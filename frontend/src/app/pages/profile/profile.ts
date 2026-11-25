import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, type PublicUser } from '../../auth/auth.service';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: '../register/register.scss',
})
export class Profile implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = new FormGroup({
    first_name: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(255)] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(255)] }),
  });
  readonly loading = signal(true);
  readonly loaded = signal(false);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loaded.set(false);
    this.errorMessage.set(null);
    this.auth.me().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ user }) => {
        this.populate(user);
        this.loaded.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        if (!this.auth.signedIn()) {
          void this.router.navigateByUrl('/login');
        } else {
          this.errorMessage.set('Impossible de charger ton profil. Réessaie plus tard.');
        }
      },
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.saved.set(false);
    if (!this.loaded() || this.form.invalid || this.saving()) return;

    this.errorMessage.set(null);
    this.saving.set(true);
    const { name, first_name } = this.form.getRawValue();
    this.auth.updateProfile(name.trim() || null, first_name.trim() || null)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: ({ user }) => {
          this.populate(user);
          this.saved.set(true);
          this.saving.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          if (!this.auth.signedIn()) {
            void this.router.navigateByUrl('/login');
          } else {
            this.errorMessage.set(error.status === 422
              ? 'Vérifie le nom et le prénom (255 caractères maximum).'
              : 'Impossible de modifier ton profil. Réessaie plus tard.');
          }
        },
      });
  }

  private populate(user: PublicUser): void {
    this.form.reset({ name: user.name ?? '', first_name: user.first_name ?? '' });
  }
}
