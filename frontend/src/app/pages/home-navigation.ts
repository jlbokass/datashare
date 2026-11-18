import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Clicking the brand while already on "/" normally triggers no Angular navigation.
 * This event makes it possible to start a new transfer without a page refresh,
 * preserving the memory-only JWT session from US04.
 */
@Injectable({ providedIn: 'root' })
export class HomeNavigation {
  private readonly requested = new Subject<void>();
  readonly resetRequested$ = this.requested.asObservable();

  requestReset(): void {
    this.requested.next();
  }
}
