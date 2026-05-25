import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _counter = 0;
  readonly toasts = signal<Toast[]>([]);

  error(message: string)   { this._add('error',   message); }
  warning(message: string) { this._add('warning', message); }
  success(message: string) { this._add('success', message); }
  info(message: string)    { this._add('info',    message); }

  dismiss(id: number) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private _add(type: Toast['type'], message: string) {
    const id = ++this._counter;
    this.toasts.update(list => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), 4_000);
  }
}
