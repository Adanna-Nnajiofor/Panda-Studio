# TODO - Panda Studio Platform

## Studio rooms + additive bookings (priority 1)

- [ ] Create `StudioRoom` Mongoose model (capacity, amenities, pricing, images, availability)
- [ ] Add admin API routes + controller: CRUD studio rooms + Cloudinary image upload (additive)
- [ ] Update booking controller to accept optional `studioRoomId` and store it without breaking existing booking payloads
- [ ] Add basic conflict prevention for `studioRoomId` (same bookingDate+bookingTime, exclude cancelled)
- [ ] Wire routes into `server/src/index.ts`
- [ ] Add TypeScript types updates if needed
- [ ] Add minimal frontend pages later (not in this phase)

## Invoices/receipts (priority 2)

- [ ] Add `Invoice` model
- [ ] On payment verification, generate invoice/receipt
- [ ] Add invoice listing endpoint + download receipt endpoint

## Crew marketplace/hire (priority 3)

- [ ] Crew profile model extensions
- [ ] Marketplace search + filter endpoints
- [ ] Hire flow creates project assignment

## Broaden reviews (priority 4)

- [ ] Expand review targets beyond crew (studio, equipment)
- [ ] Add corresponding endpoints

## CMS/files/contracts (priority 5)

- [ ] CMS pages model + read endpoints
- [ ] File/document linking to bookings/projects
- [ ] Contract generation service (PDF) later
