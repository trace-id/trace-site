# Angular

This quickstart adds Trace to an Angular 17+ app with `@trace-id/sdk-angular`. You register it once, read signals in a component, and send the `eventId` to your backend for verification. There is no zone.js dependency and no decorators.

> [!NOTE]
> **Before you start**
> You need a running Trace server and a **public key** (`pk_...`) whose allowed origins include your app (for example `http://localhost:4200`). The [quick start guide](quickstart.md) covers both.

## 1. Install the SDK

::: code-group
```sh [npm]
npm install @trace-id/sdk-angular
```
```sh [pnpm]
pnpm add @trace-id/sdk-angular
```
```sh [yarn]
yarn add @trace-id/sdk-angular
```
:::

## 2. Register it

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideTrace } from '@trace-id/sdk-angular';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [provideTrace({ apiKey: environment.tracePublicKey, endpoint: environment.traceEndpoint })],
};
```

## 3. Identify on submit

`injectVisitorData` returns `data`, `error` and `isLoading` as signals, and `getData()` to identify on demand. Call it in a field initialiser or constructor.

```ts
// signup.component.ts
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { injectVisitorData } from '@trace-id/sdk-angular';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form (ngSubmit)="submit()">
      <input name="email" [(ngModel)]="email" type="email" required />
      <button [disabled]="visitor.isLoading()">Create account</button>
    </form>
  `,
})
export class SignupComponent {
  readonly visitor = injectVisitorData({ immediate: false });
  private readonly http = inject(HttpClient);
  email = '';

  async submit() {
    const result = await this.visitor.getData({ tags: { action: 'signup' } }); // null if Trace is unavailable
    await firstValueFrom(this.http.post('/api/signup', { email: this.email, eventId: result?.eventId }));
  }
}
```

With server-side rendering, collection only starts in the browser, after the first render. Use `injectTraceClient()` for consent toggles (`enable()`, `disable(true)`).

## 4. Verify on your server

::: cards
- [Node.js](node.md) brand:nodedotjs: verifyEvent and Express/Fastify guards
- [Python](python.md) brand:python: Client.get_event from trace-device
- [PHP](php.md) brand:php: Client::getEvent from trace/trace
- [Java](java.md) brand:openjdk: getEvent from dev.trace:trace
:::

## Next steps

::: cards
- [New account fraud](new-account-fraud.md): Turn the verified event into a decision
- [Browser SDK reference](browser-sdk.md): Options, the result and every error code
:::
