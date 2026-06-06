# TODO (Panda Studio cleanup)

- [x] Confirm active frontend is `my-app/app/*` and backend entry is `my-app/server/src/index.ts`.
- [x] Verify backend wiring for payment routes.
- [x] Add `/api/payments` compatibility alias to keep both `/api/payment` and `/api/payments` working.
- [ ] Determine unused route modules (e.g. `server/src/routes/paymentRoutes.ts`) and safely remove only if not mounted.
- [ ] Build a usage map for server exports (controllers/services/models) and remove only exports not imported by routes.
- [ ] Decide whether/how to clean duplicate legacy frontend under `my-app/client/src/*` after confirming it is not used in build.

## Completed

- [x] Add `/api/payments` compatibility alias in `server/src/index.ts` so both old/new payment endpoints work.
