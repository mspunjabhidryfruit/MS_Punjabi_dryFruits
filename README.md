# MS Punjabi Dry Fruits - MERN E-commerce

Storefront + admin panel + REST API for a premium dry-fruit brand. The storefront UI was rebuilt from the supplied 8-page design PDF (announcement ticker, header/nav, product cards, right-side cart drawer, product page, category page, About, Contact, promo popup, newsletter, footer). Logo and imagery were extracted from that PDF into `client/public/img`.

## Stack
React 18 + Vite + React Router, hand-written CSS with design tokens (`client/src/styles/global.css`), Lucide icons, react-hot-toast, Axios. Node/Express, MongoDB/Mongoose, JWT, bcryptjs, Zod, Multer + Cloudinary, Razorpay, Resend, PDFKit, Helmet, CORS, rate limiting.

## Folder structure
```
client/  src/{components,pages,admin,context,services,utils,styles}
server/  src/{config,models,controllers,routes,middleware,services,validators,utils} + seed.js, assets/logo.jpg
render.yaml   (Render blueprint)   client/vercel.json (SPA rewrites)
```

## Quick start
1. `npm run install:all`
2. `cp server/.env.example server/.env` and fill in values (at minimum `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`).
3. `npm run seed` - creates categories, ~24 products, banners, coupons (`WELCOME10`, `FLAT50`), blog posts, FAQs, testimonials, site settings and the admin user. **It wipes and recreates catalogue data (not users/orders); do not re-run on a live store.**
4. Terminal 1: `npm run dev:server` (port 5000). Terminal 2: `npm run dev:client` (port 5173; Vite proxies `/api`).
5. Storefront http://localhost:5173 - Admin http://localhost:5173/admin/login (email = `ADMIN_EMAIL`, password = `SEED_ADMIN_PASSWORD`). Change the password after first login (create a new superadmin and disable the seed one, or update via the DB).

## Admin panel
Open `/admin` (e.g. http://localhost:5173/admin). Two ways in, both use the account created by `npm run seed` (`ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`):
- Sign in on the normal storefront login page. Admin accounts are taken straight to the panel, and an **Admin Panel** link appears in the header account menu, the mobile menu and on the My Account page.
- Or go directly to `/admin/login`.
Signing out of the panel also signs the admin out of the storefront. Regular customers never see the link and are refused at `/admin/login`.

## Environment variables
Server (`server/.env.example`): `PORT, NODE_ENV, MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_URL (comma-separated origins), CLOUDINARY_*, RAZORPAY_KEY_ID/SECRET, RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAIL, SEED_ADMIN_PASSWORD`.
Client (`client/.env.example`): `VITE_API_URL` - empty in dev; `https://<render-app>.onrender.com/api` in production.

## Service setup
- **MongoDB Atlas**: create a free cluster, a DB user, allow Render's IPs (or 0.0.0.0/0), copy the SRV string into `MONGO_URI`.
- **Cloudinary**: copy cloud name / key / secret. Without them the admin image uploader shows a clear error; seeded products use bundled local images. Storefront requests use `f_auto,q_auto,w_*` transformations for Cloudinary URLs.
- **Razorpay**: use Test keys first. Orders are created server-side, the payment signature is verified server-side (`POST /api/payments/verify`); dismissing/failed payments cancel the order and restore stock. Without keys, only COD is accepted.
- **Resend**: verify a sending domain, set `EMAIL_FROM` (e.g. `MS Punjabi <orders@yourdomain.com>`) and `ADMIN_EMAIL`. Missing key = emails are skipped with a log line (orders still work).

## Deployment
- **Backend (Render)**: New > Blueprint (uses `render.yaml`) or a Web Service with root `server`, build `npm install`, start `npm start`. Set the env vars; `CLIENT_URL` = your Vercel URL.
- **Frontend (Vercel)**: root directory `client`, framework Vite, build `npm run build`, output `dist`; env `VITE_API_URL`. `vercel.json` provides SPA rewrites.
- Run the seed once against production (`MONGO_URI=... npm run seed` locally) or create your own data in the admin.

## How key rules are enforced (server)
- Cart totals, prices, coupons, delivery and tax are always recomputed from the database (`services/pricing.js`); client totals are never trusted.
- Stock is reserved atomically (`$elemMatch` + `$gte` + `$inc`) and restored on cancellation/failed payment.
- Orders store immutable item snapshots and a status history; every admin status change adds a history entry and sends an email.
- Reviews require a purchase (non-cancelled order) and need admin approval.

## Design/scope notes
- Styling is custom CSS from PDF-derived tokens; Tailwind and Framer Motion were intentionally not added (CSS transitions cover the drawer/modal/hover effects).
- Passwords use `bcryptjs` (pure JS, same algorithm, no native build step). Auth is a Bearer JWT in localStorage (customer and admin tokens are stored separately).
- Cart and wishlist for signed-in users are stored on the `User` document (guest cart in localStorage, merged on login) instead of separate collections.
- "Buy 2 Get 1 free"-style promotions are display content (badges, ticker, popup) managed in the admin; they are not auto-applied at checkout - use coupons for real discounts.
- Delivery ETA/pincode check is a zone-based estimate (first pincode digit), not a courier serviceability lookup.

## Troubleshooting
- `Missing required environment variables` on server start: create `server/.env`.
- CORS error in the browser: add the exact frontend origin (no trailing slash) to `CLIENT_URL`.
- Blank product images after upload: check Cloudinary vars. 503 on upload = not configured.
- Razorpay button says unavailable: set both Razorpay keys and restart the server.

## Verification performed
Before packaging, the API was exercised with ~120 automated end-to-end checks (auth, catalogue filters/search/sort, cart pricing, coupons, COD orders, stock decrement/restore, cancellation, Razorpay signature verification and failed-payment rollback, reviews, contact, newsletter, admin CRUD, status transitions, invoice and shipping PDFs, settings) and the UI was walked through in headless Chromium (storefront, checkout, order confirmation, downloads, all admin pages, mobile layout at 360px) with no console errors or broken images.
Not exercised against live services: MongoDB Atlas-specific behaviour (atomic `$elemMatch` stock reservation and the dashboard `$group`/`$dateToString` aggregations were written for real MongoDB), the Razorpay checkout popup and API, Resend email delivery and Cloudinary uploads. Test those once with your own keys.
