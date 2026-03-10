# Quote Number Generation Implementation

## Overview
Automatic quote number generation when a devis (quote) status changes from "Brouillon" (Draft) or "Prêt" (Ready) to "Envoyé" (Sent) or any higher status.

## Quote Number Pattern
```
DV-{BusinessType}-{BusinessName}-{IncrementalCode}
```

### Example
```
DV-PE-AC-001
```

Where:
- `DV` = Devis (Quote)
- `PE` = First 2 letters of business type (e.g., "PEintre")
- `AC` = First 2 letters of business/company name (e.g., "ACme Corp")
- `001` = Incremental 3-digit code based on total quotes for this artisan

## Implementation Details

### 1. New Utility File: `src/utils/quoteNumberGenerator.ts`

#### Functions:

**`generateQuoteNumber(businessType, businessName, profileId)`**
- Extracts first 2 letters from business type (uppercase)
- Extracts first 2 letters from business name (uppercase)
- Queries database to count existing quotes for the artisan
- Generates incremental code (001, 002, 003, etc.)
- Returns formatted quote number
- Fallback: Uses timestamp if generation fails

**`getBusinessTypeLabel(metierId)`**
- Fetches the business type label from the `metiers` table
- Returns "Artisan" as fallback if not found

### 2. Updated File: `src/features/Artisan/leads/ArtisanLeads.tsx`

#### Changes in `handleStatusChange()`:
1. Checks if quote number generation is needed:
   - Current status is "draft" or "ready"
   - New status is "sent", "viewed", "accepted", or "refused"
   - Quote doesn't already have a quote_number

2. If needed:
   - Fetches business type from user's metier_id
   - Generates quote number using business type and company name
   - Updates database with new quote number
   - Updates local state (devisList and leads)

3. Uses generated quote number in email notifications

#### Changes in `handleConfirmWhatsapp()`:
- Same logic as `handleStatusChange()`
- Generates quote number before sending WhatsApp message
- Updates pendingDevis object with new quote number

## Status Transitions That Trigger Generation

| From Status | To Status | Generates Quote Number |
|-------------|-----------|------------------------|
| Brouillon   | Envoyé    | ✅ Yes                 |
| Brouillon   | En discussion | ✅ Yes             |
| Brouillon   | Accepté   | ✅ Yes                 |
| Brouillon   | Refusé    | ✅ Yes                 |
| Prêt        | Envoyé    | ✅ Yes                 |
| Prêt        | En discussion | ✅ Yes             |
| Prêt        | Accepté   | ✅ Yes                 |
| Prêt        | Refusé    | ✅ Yes                 |
| Envoyé      | Accepté   | ❌ No (already has number) |
| Any         | Any       | ❌ No (if already has number) |

## Database Schema Requirements

The implementation assumes:
- `quotes` table has a `quote_number` column (nullable string)
- `quotes` table has a `profile_id` column
- `metiers` table exists with `id` and `label` columns
- `profiles` table has `metier_id`, `company_name`, and `display_name` columns

## Error Handling

1. **Database Query Failure**: Falls back to timestamp-based number (DV-XX-XX-{timestamp})
2. **Missing Business Type**: Uses "Artisan" as default
3. **Missing Business Name**: Uses user's display_name or "Business" as fallback
4. **Generation Failure**: Toast error notification shown to user

## User Experience

1. User changes status from "Brouillon" to "Envoyé"
2. System automatically generates quote number in background
3. Quote number is saved to database
4. UI updates to show new quote number
5. Email/WhatsApp includes the generated quote number
6. Success toast notification confirms status update

## Testing Checklist

- [ ] Test status change from Brouillon → Envoyé
- [ ] Test status change from Prêt → Envoyé
- [ ] Test status change from Brouillon → Accepté
- [ ] Test WhatsApp sending with quote number generation
- [ ] Test email sending with quote number generation
- [ ] Verify incremental codes (001, 002, 003...)
- [ ] Test with different business types
- [ ] Test with different company names
- [ ] Test fallback when business info is missing
- [ ] Verify quote number appears in UI after generation
