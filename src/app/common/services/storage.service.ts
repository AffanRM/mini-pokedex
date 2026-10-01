import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly platformId = inject(PLATFORM_ID);

  /** Read a preference safely when storage is unavailable or access is denied. */
  get(key: string): string | null {
    try {
      return isPlatformBrowser(this.platformId) ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }

  /** Persist or remove a preference without making storage failure break the UI. */
  set(key: string, value: string | null): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      // Preferences are optional: quota/privacy restrictions must not interrupt use.
    }
  }
}
