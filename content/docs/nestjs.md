# NestJS

This quickstart verifies Trace events in a NestJS app. A small guard calls `verifyEvent` from `@trace-id/sdk-node`, so it works with both the Express and Fastify platforms.

> [!NOTE]
> **Before you start**
> You need a **secret key** (`sk_...`) from the dashboard's Keys page and a frontend that sends an `eventId` (see the [Web quickstarts](javascript.md)). Send it in the `x-trace-event-id` header or as `eventId` in the request body.

## 1. Install the SDK

::: code-group
```sh [npm]
npm install @trace-id/sdk-node
```
```sh [pnpm]
pnpm add @trace-id/sdk-node
```
```sh [yarn]
yarn add @trace-id/sdk-node
```
:::

```dotenv
TRACE_SECRET_KEY=sk_...
TRACE_ENDPOINT=https://id.example.com
```

## 2. Write the guard

```ts
// trace.guard.ts
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { verifyEvent } from '@trace-id/sdk-node';
import { VerifyError } from '@trace-id/sdk-node/errors';

@Injectable()
export class TraceGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const eventId: string | undefined = req.headers['x-trace-event-id'] ?? req.body?.eventId;
    if (!eventId) throw new BadRequestException('Missing Trace event id');

    try {
      const event = await verifyEvent(eventId, {
        secretKey: process.env.TRACE_SECRET_KEY!,
        endpoint: process.env.TRACE_ENDPOINT!,
        timeoutMs: 1500,
      });
      if (event.suspectScore >= 60) throw new ForbiddenException('Request rejected');
      req.trace = event; // the server-verified event
      return true;
    } catch (err) {
      if (!(err instanceof VerifyError)) throw err;
      if (err.code === 'unauthorized') throw err; // a wrong key is our bug: never fail open
      if (['not_found', 'expired', 'invalid_event_id'].includes(err.code)) throw new BadRequestException('Invalid Trace event');
      throw new ServiceUnavailableException('Trace could not verify the event'); // or return true to fail open
    }
  }
}
```

## 3. Use it

```ts
// signup.controller.ts
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { TraceGuard } from './trace.guard';

@Controller('signup')
export class SignupController {
  @Post()
  @UseGuards(TraceGuard)
  create(@Body() body: { email: string }, @Req() req: { trace: { visitorId: string } }) {
    // create the account, and store req.trace.visitorId with it for later lookups
    return { ok: true };
  }
}
```

On the Express platform you can also use the ready-made middleware: `consumer.apply(traceGuard({ failOpen: true })).forRoutes('signup')` with `traceGuard` from `@trace-id/sdk-node/express`. On the Fastify platform, `traceHook` from `@trace-id/sdk-node/fastify` fits `addHook('preHandler', ...)`.

> [!TIP]
> **Start in shadow mode**
> For the first week, log `event.suspectScore` and `event.reasons` instead of rejecting. Look at who would have been blocked, then pick thresholds you trust.

## Frontends

::: cards
- [JavaScript](javascript.md) brand:javascript: The browser SDK for any site
- [React](react.md) brand:react: IdentifyProvider and useVisitorData
- [Vue](vue.md) brand:vuedotjs: Plugin and composable
- [Next.js](nextjs.md) brand:nextdotjs: Provider and route guard
:::

## Next steps

::: cards
- [New account fraud](new-account-fraud.md): Turn the verified event into a decision
- [Server SDKs reference](server-sdks.md): Options and error codes for every language
:::
