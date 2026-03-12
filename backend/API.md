# MachaRent API Documentation

Base URL: `http://localhost:5000/v1`  
Production: `https://api.macharent.co.ke/v1`

All responses follow this format:
```json
{ "success": true, "message": "...", "data": {} }
{ "success": false, "message": "Error description", "data": null }
```

Authenticated routes require: `Authorization: Bearer <accessToken>`

---

## Authentication

### POST /auth/register
Create a new account.
```json
// Request
{ "phone": "0712345678", "password": "min6chars", "full_name": "John Doe", "role": "LANDLORD" }

// Response 201
{ "accessToken": "...", "refreshToken": "...", "user": { "id": "...", "phone": "+254712345678", "role": "LANDLORD" } }
```

### POST /auth/login
```json
// Request
{ "phone": "0712345678", "password": "yourpassword" }

// Response 200
{ "accessToken": "...", "refreshToken": "...", "user": { ... } }
```

### POST /auth/refresh
```json
// Request
{ "refreshToken": "..." }

// Response 200
{ "accessToken": "...", "refreshToken": "..." }
```

### POST /auth/logout
```json
// Request
{ "refreshToken": "..." }
```

### POST /auth/change-password  🔒
```json
// Request
{ "current_password": "old", "new_password": "new6chars" }
```

---

## Listings (Public)

### GET /listings
Browse listings with filters.

| Param | Type | Description |
|-------|------|-------------|
| page | number | Default 1 |
| limit | number | Default 12, max 50 |
| area | string | Area slug e.g. `athi-river` |
| min_price | number | Minimum rent KES |
| max_price | number | Maximum rent KES |
| bedrooms | number | Number of bedrooms |
| available | boolean | Only available listings |
| q | string | Full-text search |

### GET /listings/featured
Returns boosted listings first, then random selection. Used for landing page.

### GET /listings/top-reviews
Returns top 3 reviews (4+ stars) for landing page testimonials.

### GET /listings/:id
Full listing detail including images, amenities, landlord info, reviews.

### POST /listings/:id/report  🔒 (optional auth)
```json
{ "reason": "SCAM|WRONG_INFO|INAPPROPRIATE|OTHER", "details": "optional description" }
```

---

## Search

### GET /search?q=apartment+athi+river
Full-text search across titles, descriptions and areas.

### GET /search/suggest?q=mach
Autocomplete suggestions for search bar.

---

## Landlord Dashboard  🔒 LANDLORD only

### GET /landlord/stats
Returns total listings, views, inquiries, wishlists.

### GET /landlord/analytics
Returns 14-day view chart, top listings, recent inquiries, boost history.

### GET /landlord/listings
Paginated list of landlord's own listings.

### POST /landlord/listings
Create a listing.
```json
{
  "title": "min 10 chars",
  "description": "min 50 chars",
  "price_kes": 15000,
  "deposit_kes": 15000,
  "bedrooms": 2,
  "bathrooms": 1,
  "area_id": "uuid",
  "latitude": -1.5177,
  "longitude": 37.2634,
  "address_hint": "Near Total petrol station",
  "amenity_ids": ["uuid1", "uuid2"]
}
```

### PATCH /landlord/listings/:id
Update listing fields (same as create, all optional).

### DELETE /landlord/listings/:id
Delete a listing (also deletes images from Cloudinary).

### PATCH /landlord/listings/:id/availability
```json
{ "is_available": true }
```

### PATCH /landlord/listings/:id/rent-status
```json
{ "action": "rent_out" }   // Hides listing, marks as RENTED
{ "action": "relist" }     // Restores listing as ACTIVE
```

### POST /landlord/listings/:id/images
Multipart form upload. Field name: `images` (multiple files supported).

### DELETE /landlord/listings/:id/images/:imageId
Remove a single image.

### PATCH /landlord/listings/:id/images/:imageId/primary
Set an image as the primary/cover photo.

---

## Payments  🔒 LANDLORD only

### GET /payments/packages
Returns available boost packages:
```json
[
  { "days": 7,  "amount": 200, "label": "1 Week",  "popular": false },
  { "days": 14, "amount": 350, "label": "2 Weeks", "popular": true  },
  { "days": 30, "amount": 600, "label": "1 Month", "popular": false }
]
```

### POST /payments/boost
Initiate M-Pesa STK push or return manual Paybill details.
```json
// Request
{ "apartment_id": "uuid", "days": 14, "phone": "0712345678" }

// Response — STK push sent
{ "payment_id": "uuid", "checkout_id": "ws_CO_...", "manual": false }

// Response — Manual fallback
{ "payment_id": "uuid", "paybill": "174379", "account": "MachaRent-abc123", "amount": 350, "manual": true }
```

### POST /payments/:id/confirm
Manually confirm payment with M-Pesa code.
```json
{ "mpesa_code": "QHX7K2MNOP" }
```

### GET /payments/status/:checkoutId
Poll STK push status.

### GET /payments/history
Landlord's payment history.

### POST /payments/callback
**Safaricom M-Pesa callback. Not for direct use.**  
Protected by IP whitelist in production (Safaricom IPs only).

---

## Messages  🔒

### GET /messages
List all conversation threads for current user.

### POST /messages
Start a new conversation with a landlord.
```json
{ "apartment_id": "uuid", "message": "Is this still available?" }
```

### GET /messages/:inquiryId
Get full message thread.

### POST /messages/:inquiryId/reply
```json
{ "message": "Yes, it is available. When would you like to view?" }
```

### GET /messages/unread/count
Returns unread message count for navbar badge.

---

## Wishlist  🔒

### GET /wishlist
User's saved listings.

### POST /wishlist/:apartmentId
Save a listing.

### DELETE /wishlist/:apartmentId
Remove from wishlist.

### GET /wishlist/check/:apartmentId
Check if a listing is wishlisted. Returns `{ wishlisted: true/false }`.

---

## Notifications  🔒

### GET /notifications
All notifications for current user, ordered newest first.

### PATCH /notifications/read-all
Mark all as read.

### PATCH /notifications/:id/read
Mark one as read.

---

## Admin Panel  🔒 ADMIN only

### GET /admin/stats
Platform-wide statistics.

### GET /admin/listings
All listings with filters. Params: `status`, `page`, `limit`.

### PATCH /admin/listings/:id/status
```json
{ "status": "ACTIVE|REJECTED|SUSPENDED|ARCHIVED", "admin_note": "optional" }
```

### PATCH /admin/listings/:id/verify
```json
{ "level": "UNVERIFIED|PHONE_VERIFIED|IN_PERSON_VERIFIED" }
```

### PATCH /admin/listings/:id/boost
```json
{ "boosted": true, "days": 7 }
```

### GET /admin/users
All users. Params: `role`, `page`, `limit`.

### PATCH /admin/users/:id/status
```json
{ "is_active": false }
```

### GET /admin/reports
Listing reports. Params: `resolved`, `page`.

### PATCH /admin/reports/:id/resolve
Mark report as resolved.

---

## Areas & Amenities (Public)

### GET /areas
All areas with listing count and average price.

### GET /areas/:slug
Single area detail.

### GET /amenities
All amenities grouped by category.

---

## Error Codes

| HTTP | Meaning |
|------|---------|
| 400 | Bad request / validation error |
| 401 | Not authenticated |
| 403 | Authenticated but not authorised |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate phone) |
| 429 | Rate limited |
| 500 | Server error |

---

## Rate Limits

- Auth endpoints (login, register): 20 requests / 15 minutes per IP
- All other endpoints: 200 requests / 15 minutes per IP
