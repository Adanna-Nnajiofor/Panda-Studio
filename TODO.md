# TODO

## Rentals 500: debug & fix

- [ ] Add richer logging + safer error response in `server/src/controllers/rentalController.ts` to expose why Cloudinary/upload failed.
- [ ] Improve middleware/error propagation so multer upload errors surface clearly.
- [ ] Re-run `POST /api/rentals` and verify console shows the actual failure source.
