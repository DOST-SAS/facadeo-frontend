# Plan Structure Update - Database Schema Alignment

## Overview
Updated the Plan interface and all related code to exactly match the Supabase database schema.

## Database Schema (Exact Match)

```sql
create table public.plans (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text not null,
  monthly_credit integer not null,
  price_cents integer not null,
  currency text not null default 'EUR'::text,
  features jsonb null default '{}'::jsonb,
  stripe_product_id text null,
  stripe_price_id text null,
  description text null,
  active boolean not null default true,
  is_public boolean not null default true,
  sort_order integer null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  sub_features json null,
  type public.plan_types null,
  constraint plans_pkey primary key (id),
  constraint plans_slug_key unique (slug)
) TABLESPACE pg_default;
```

## Changes Made

### 1. Plan Interface (`types.ts`)

**Updated to use exact database field names (snake_case):**

```typescript
export interface Plan {
    // Database fields (exact match)
    id: string
    name: string
    slug: string
    monthly_credit: number          // ✅ snake_case (was monthlyCredit)
    price_cents: number              // ✅ snake_case (was priceCents)
    currency: string
    features: Record<string, number | string | boolean>  // jsonb
    stripe_product_id?: string | null
    stripe_price_id?: string | null
    description?: string | null
    active: boolean                  // ✅ (was isActive)
    is_public: boolean               // ✅ snake_case (was isPublic)
    sort_order?: number | null
    created_at?: string
    updated_at?: string
    sub_features?: string[] | null   // json array
    type?: "debutant" | "professionnel" | "entreprise" | null
    
    // Frontend-only fields (not in database)
    icon?: any
    isPopular?: boolean
    popularLabel?: string
    isCurrent?: boolean
}
```

**Removed fields that don't exist in database:**
- ❌ `period` - removed
- ❌ `buttonText` - removed
- ❌ `priceCents` (camelCase) - now only `price_cents`
- ❌ `monthlyCredit` (camelCase) - now only `monthly_credit`
- ❌ `isActive` (camelCase) - now only `active`
- ❌ `isPublic` (camelCase) - now only `is_public`

### 2. PLANS Mock Data (`constants/index.ts`)

**Updated all plans to use database field names:**

```typescript
{
    id: "monthly",
    name: "Abonnement Mensuel",
    slug: "abonnement-mensuel",
    type: "debutant",
    monthly_credit: 100,        // ✅ snake_case
    price_cents: 4900,          // ✅ snake_case
    currency: "EUR",
    active: true,               // ✅ not isActive
    is_public: true,            // ✅ snake_case
    sort_order: 1,
    features: { ... },
    sub_features: [ ... ],
    // Frontend-only
    icon: Calendar,
    isCurrent: true
}
```

### 3. AdminAbonnements Component

**Updated all field references:**

- Form initialization uses `price_cents`, `monthly_credit`, `active`, `is_public`
- Table columns updated to use `row.original.price_cents`, `row.original.monthly_credit`, `row.original.active`
- Input fields updated to use correct field names
- Removed references to non-existent fields (`period`, `buttonText`)

## Field Mapping Reference

| Database Field | Type | Required | Default | Notes |
|---------------|------|----------|---------|-------|
| `id` | uuid | ✅ | gen_random_uuid() | Primary key |
| `name` | text | ✅ | - | Plan name |
| `slug` | text | ✅ | - | Unique URL slug |
| `monthly_credit` | integer | ✅ | - | Credits per month |
| `price_cents` | integer | ✅ | - | Price in cents |
| `currency` | text | ✅ | 'EUR' | Currency code |
| `features` | jsonb | ❌ | {} | Key-value features |
| `stripe_product_id` | text | ❌ | null | Stripe product ID |
| `stripe_price_id` | text | ❌ | null | Stripe price ID |
| `description` | text | ❌ | null | Plan description |
| `active` | boolean | ✅ | true | Is plan active |
| `is_public` | boolean | ✅ | true | Is publicly visible |
| `sort_order` | integer | ❌ | 0 | Display order |
| `created_at` | timestamptz | ✅ | now() | Creation timestamp |
| `updated_at` | timestamptz | ✅ | now() | Update timestamp |
| `sub_features` | json | ❌ | null | Array of features |
| `type` | plan_types | ❌ | null | Plan category |

## Benefits

1. **Database Alignment**: Perfect 1:1 match with Supabase schema
2. **Type Safety**: TypeScript enforces correct field names
3. **API Ready**: Can directly save/fetch from database without field mapping
4. **Consistency**: All code uses the same field names
5. **Maintainability**: Clear separation between database and frontend-only fields

## Migration Notes

If you have existing code that uses the old field names (camelCase), you'll need to update:
- `priceCents` → `price_cents`
- `monthlyCredit` → `monthly_credit`
- `isActive` → `active`
- `isPublic` → `is_public`
- Remove references to `period` and `buttonText`
