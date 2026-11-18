import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

type FieldErrors = Record<string, string[]>;

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmation = control.get('passwordConfirmation')?.value;

  return password === confirmation ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly http = inject(HttpClient);

  readonly form = new FormGroup(
    {
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email, Validators.maxLength(255)],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      passwordConfirmation: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordsMatch },
  );

  readonly submitting = signal(false);
  readonly created = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly fieldErrors = signal<FieldErrors>({});

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.errorMessage.set(null);
    this.fieldErrors.set({});
    this.submitting.set(true);

    const { email, password } = this.form.getRawValue();

    this.http
      .post<{ user: { id: string; email: string; created_at: string } }>(
        '/api/auth/register',
        { email: email.trim().toLowerCase(), password },
      )
      .subscribe({
        next: () => {
          this.created.set(true);
          this.form.reset();
          this.submitting.set(false);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 422 && error.error?.errors) {
            this.fieldErrors.set(error.error.errors as FieldErrors);
            this.errorMessage.set('Vérifie les champs indiqués avant de réessayer.');
          } else {
            this.errorMessage.set('Impossible de créer le compte. Réessaie plus tard.');
          }
          this.submitting.set(false);
        },
      });
  }
}
