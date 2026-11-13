# Northstar Supply

This Next.js storefront is the evaluation workspace for PostHog installation tasks. It includes:

- App Router pages and dynamic product routes
- Product search, filters, sorting, and detail views
- A persistent client-side cart
- Checkout and newsletter API routes with Zod validation
- Account preferences, loading states, error states, and empty states
- Responsive layouts for desktop and mobile

The app does not include PostHog. Installing and verifying it is the agent task.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Run these commands before you finish:

```sh
npm run typecheck
npm run build
```
