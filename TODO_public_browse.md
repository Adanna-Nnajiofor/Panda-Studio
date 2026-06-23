# TODO: Public browse (no login) vs protected hire/book

## Backend

- [ ] Add public read endpoints
  - [ ] Projects: `/api/projects/public` (active/public only)
  - [ ] Moodboards: `/api/moodboards/public` and/or public `GET /api/moodboards/:id` using `isPublic`
  - [ ] Crew: `/api/users/crew/public` (public profiles only)
  - [ ] Referrals: public viewing safe endpoint or keep behind auth
  - [ ] AI: public landing only; keep tools behind auth
- [ ] Keep write endpoints protected
  - [ ] Hire create/respond
  - [ ] Booking create/cancel/status
  - [ ] Quote create/update/status
  - [ ] Checkout/cart mutations

## Frontend

- [ ] Update pages to remove `RoleGate` for browse-only sections
  - [ ] `/projects` should use public endpoint, not `/projects/mine`
  - [ ] `/moodboard` should use public endpoint, not `/moodboards/mine`
  - [ ] `/crew/marketplace` should use public crew endpoint
  - [ ] `/events` should not be gated by `RoleGate`
  - [ ] `/referrals` should be public-safe or remain behind auth
- [ ] Ensure hire/book/submit actions redirect to `/login` or `/register` if unauthenticated

## Testing

- [ ] Load site as logged-out user and verify browse sections render
- [ ] Attempt hire/book/checkout flows as logged-out user and verify login redirect
