# JewelLens Backend

This README documents the current backend implementation for JewelLens. It is intended to be a working technical reference for backend development, API usage, debugging, and future feature expansion.

## Overview

The backend is a Node.js + Express REST API backed by MongoDB. It currently supports:

- authentication and admin creation
- users, profile, cart, wishlist, and avatar upload
- categories and products
- order creation and admin order management
- homepage CMS content
- footer settings management

Main stack:

- Node.js
- Express 5
- MongoDB
- Mongoose
- JWT
- Zod
- Cloudinary
- Multer

## Project Structure

```text
backend_JewelLens/
├── server.js
├── package.json
├── README.md
└── src/
    ├── app.js
    ├── config/
    │   ├── cloudinary.js
    │   └── db.js
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── seeders/
    ├── utils/
    └── validations/
```

## Runtime Flow

Startup sequence:

1. `server.js` loads environment variables.
2. DNS servers are set explicitly.
3. MongoDB connection is established through `src/config/db.js`.
4. Express app from `src/app.js` is started.

`src/app.js` is responsible for:

- CORS setup
- JSON body parsing
- request logging
- health endpoint
- route registration
- global error handling

## Environment Variables

Required or implied by current code:

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `GOOGLE_CLIENT_ID`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `SEED_ADMIN_NAME`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_ADMIN_ROLE`
- `SEED_ADMIN_PHONE`
- `SEED_ADMIN_ADDRESS`

Notes:

- `PORT` defaults to `5000`
- `CLIENT_URL` defaults to `http://localhost:8080`
- Cloudinary env vars are mandatory if avatar upload is enabled

## Scripts

```bash
npm install
npm run dev
```

Available scripts:

- `npm run dev`: start backend with nodemon
- `npm start`: start backend normally
- `npm run seed:admin`: create or update seed admin account

## Middleware

### `auth.middleware.js`

- `protect`
  - expects `Authorization: Bearer <token>`
  - verifies JWT using `JWT_SECRET`
  - loads user into `req.user`
- `adminOnly`
  - blocks non-admin users

### `error.middleware.js`

Handles:

- custom `ApiError`
- Multer upload errors
- generic 500 fallback

### `upload.middleware.js`

Used for avatar upload.

Behavior:

- uploads to Cloudinary folder `JewelLens/avatar`
- accepts image mime types only
- max size is `5 MB`
- transforms image to `600x600`

### Other middleware

- `async.middleware.js`: async controller wrapper
- `logger.middleware.js`: request logger

## Utility Layer

### `ApiResponse`

Used to send structured success responses.

Typical format:

```json
{
  "status": 200,
  "message": "Success message",
  "data": {}
}
```

### `ApiError`

Used for controlled errors with HTTP status codes.

## Database Models

### User

File: `src/models/user.model.js`

Fields:

- `name`
- `email`
- `password`
- `phone`
- `address`
- `avatar`
- `addresses[]`
- `shippingProfile`
- `lastLogin`
- `provider`
- `providerId`
- `role`
- `wishlist[]`
- `cart[]`

Important notes:

- `role` is `user` or `admin`
- `provider` is `local`, `google`, or `facebook`
- cart stores `{ product, quantity }`
- wishlist stores product IDs

### Category

File: `src/models/category.model.js`

Fields:

- `name`
- `slug`
- `icon`
- `status`

Rules:

- `name` is stored lowercase
- `slug` is auto-generated from name
- duplicate names are prevented

### Product

File: `src/models/product.model.js`

Fields include:

- `name`
- `slug`
- `description`
- `category`
- `price`
- `originalPrice`
- `stockCount`
- `inStock`
- `material`
- `weight`
- `images[]`
- `rating`
- `reviews`
- `variants[]`
- `specifications`
- `careInstructions[]`
- `certifications[]`
- `faqs[]`
- `craftsmanshipStory`
- `warranty`
- `returnPolicy`
- `estimatedDeliveryDays`
- `freeShipping`
- `codAvailable`
- `emiAvailable`
- `offerBadge`
- `offerEndsAt`
- `featured`
- `frequentlyBoughtTogether[]`
- `completeLook[]`
- `tryOnModelUrl`

### Order

File: `src/models/order.model.js`

Main sections:

- `orderNumber`
- `user`
- `items[]`
- `shippingAddress`
- `pricing`
- `paymentMethod`
- `paymentStatus`
- `orderStatus`
- `deliveryOption`
- `deliveryInstructions`
- `statusHistory[]`
- `notes`

Current business rules:

- only `cod` payment works right now
- tax is `8%`
- express delivery adds `250`
- stock is reduced during order placement
- stock is restored on qualifying cancellation or deletion
- user can cancel only `processing` orders within `2 hours`

### CMS Models

`HeroSlider`

- `title`
- `subtitle`
- `image`
- `link`
- `status`
- `order`

`Occasion`

- `name`
- `icon`
- `image`
- `link`
- `status`

`BrandPartner`

- `name`
- `logo`
- `status`

`InstagramPost`

- `image`
- `caption`
- `likes`
- `link`
- `status`

`FooterSetting`

- `brandName`
- `description`
- `phone`
- `email`
- `addressLine1`
- `addressLine2`
- `copyrightText`
- `shopLinks[]`
- `companyLinks[]`
- `isActive`

Footer behavior:

- public footer reads the active footer setting
- when a new active footer is saved, others are deactivated
- `shopLinks` lets admin explicitly control footer shop categories

## Validation

Current Zod validation files:

- `auth.validation.js`
- `brandPartner.validation.js`
- `category.validation.js`
- `heroSlider.validation.js`
- `instagramPost.validation.js`
- `occasion.validation.js`
- `product.validation.js`

Important notes:

- product validation accepts either a category ID or an object containing `_id`
- image arrays are expected to contain valid URLs
- login and registration enforce minimum password length

## API Modules

Base path: `/api`

## Health

### `GET /api/health`

Simple server health check.

## Auth Routes

Base path: `/api/auth`

### `POST /register`

Registers a normal user.

Expected payload:

- `name`
- `email`
- `password`
- `confirmPassword`
- `terms`
- `phone` optional
- `address` optional

Behavior:

- rejects if terms not accepted
- rejects if passwords do not match
- hashes password with bcrypt
- returns user and token

### `POST /login`

Logs user in.

Payload:

- `email`
- `password`
- `remember`

Behavior:

- validates credentials
- updates `lastLogin`
- returns token
- token expiry is `30d` if remember is enabled, otherwise `7d`

### `POST /oauth`

OAuth login entry point.

Supported providers:

- Google
- Facebook

Behavior:

- validates provider token with remote provider API
- creates account if user does not exist
- links provider data if matching local email already exists

### `POST /createadmin`

Protected admin route to create another admin.

### `PUT /updateadmin/:id`

Protected admin route to update an admin.

### `DELETE /deleteadmin/:id`

Protected admin route to delete an admin.

## User Routes

Base path: `/api/users`

### Current user routes

- `GET /me`
- `PUT /me`
- `PUT /me/password`
- `DELETE /me`
- `GET /me/cart`
- `PUT /me/cart`
- `GET /me/wishlist`
- `PUT /me/wishlist`
- `POST /upload-avatar`

Current profile update supports:

- `name`
- `phone`
- `addresses`
- `shippingProfile`

### Admin/general user routes

- `GET /`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`

Current logic notes:

- `GET /` is admin-only
- `GET /:id` allows admin or self
- `PUT /:id` currently allows self-edit, but if caller is admin the route only allows editing admin accounts through this path
- `DELETE /:id` allows admin or self

## Category Routes

Base path: `/api/categories`

- `GET /`
- `GET /slug/:slug`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

Notes:

- create, update, delete are admin-protected
- all categories are returned in descending creation order

## Product Routes

Base path: `/api/products`

- `POST /`
- `GET /`
- `GET /:slug`
- `PUT /:id`
- `DELETE /:id`
- `GET /related/:slug`

Behavior:

- `GET /` returns all products with populated category
- `GET /:slug` populates category, frequently bought together, and complete look
- `GET /related/:slug` returns up to 4 products from same category

Important implementation note:

- the route file imports `protect` and `adminOnly`, but create/update/delete product routes are not currently guarded in the route definitions

## Order Routes

Base path: `/api/orders`

### Customer routes

- `POST /`
- `GET /me`
- `GET /me/:id`
- `PATCH /me/:id/cancel`
- `DELETE /me/:id`

### Admin routes

- `GET /admin/stats`
- `GET /admin/list`
- `GET /admin/:id`
- `PUT /admin/:id`
- `DELETE /admin/:id`

Order rules:

- customer order creation requires at least one item
- payment method must currently be `cod`
- delivery option must be `standard` or `express`
- order history can remove only delivered orders from user side
- admin can edit payment status, order status, shipping address, notes, and delivery info
- if admin changes COD delivered order from pending to delivered, payment becomes `paid`

Admin stats currently include:

- recent orders
- total revenue
- user count
- product count
- status counts
- monthly revenue data

## Homepage CMS Routes

### Hero Sliders

Base path: `/api/hero-sliders`

- `GET /`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### Occasions

Base path: `/api/occasions`

- `GET /`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### Brand Partners

Base path: `/api/brand-partners`

- `GET /`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### Instagram Posts

Base path: `/api/instagram-posts`

- `GET /`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### Footer Settings

Base path: `/api/footer-settings`

- `GET /`
- `GET /admin`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

Behavior:

- public route returns active footer only
- admin route returns all footer configs
- active save deactivates other records

## Seeder

File: `src/seeders/admin.seeder.js`

Purpose:

- creates admin if missing
- updates existing admin password and profile if email already exists

Reads from:

- `SEED_ADMIN_NAME`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_ADMIN_ROLE`
- `SEED_ADMIN_PHONE`
- `SEED_ADMIN_ADDRESS`

## Known Backend Gaps

- product create/update/delete routes should be protected but currently are not
- forgot-password flow is not present in current backend routes
- reviews, testimonials, coupons, settings, and contact-message backend modules are not present in the discovered backend code
- most media outside avatar upload is URL-based rather than uploaded through a backend media pipeline

## Recommended Future Backend Documentation Additions

- request and response examples per route
- database index notes
- deployment and production env guide
- logging and monitoring notes
- payment integration notes when non-COD methods are added
