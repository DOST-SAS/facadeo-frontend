# Simulation Credit Validation Implementation

## Overview
Added credit validation before allowing users to generate AI facade simulations. Users must have sufficient credits based on the Gemini image generation API cost.

## Changes Made

### 1. New Service: `simulationCostCalculator.ts`
**Location:** `src/services/gemini-ai/simulationCostCalculator.ts`

**Purpose:** Calculate the credit cost for generating a simulation image

**Key Features:**
- Loads `geminiNanoImageKey.tarif` from backend settings (via `api_call_costs` view)
- Converts API cost (in dollars) to credits using `dollarsPerToken` ratio
- Default: $0.0025 per image generation (~$2.5 per 1000 calls)
- Default: $0.04 per token ($20 = 500 tokens)
- Returns estimate with `creditsRequired` and `hasEnoughCredits` flag

**Methods:**
```typescript
estimateSimulationCost(userCredits: number): Promise<SimulationCostEstimate>
```

### 2. Updated Service: `simulation.ts`
**Location:** `src/services/gemini-ai/simulation.ts`

**Changes:**
- Added `userCredits` parameter to `generateSimulation()` method
- Validates credits BEFORE generating the image
- Charges credits using `CreditLedger.createEntry()` with type `"scan_charge"`
- Returns error if insufficient credits
- Transaction includes metadata: facade_id, api_cost, charged_at

**Credit Ledger Entry:**
```typescript
{
  type: "scan_charge",
  amount: -creditsRequired, // negative for charge
  referenceType: "simulation_generation",
  metadata: {
    facade_id: string,
    api_cost: number,
    charged_at: ISO timestamp
  }
}
```

### 3. Updated Component: `CreateDevi.tsx`
**Location:** `src/features/Artisan/devis/CreateDevi.tsx`

**Changes:**
- Added state for `simulationCostEstimate`
- Loads cost estimate on mount using `useEffect`
- Validates credits before allowing simulation generation
- Shows credit cost badge next to "Créer une simulation" button
- Disables button if insufficient credits
- Displays error toast with required vs available credits

**UI Enhancements:**
- Green badge: "Coût: X crédit(s)" when sufficient
- Red badge: "Coût: X crédit(s) (Insuffisant)" when insufficient
- Button disabled when credits are insufficient

### 4. Updated Exports: `index.ts`
**Location:** `src/services/gemini-ai/index.ts`

**Added:**
```typescript
export { SimulationCostCalculator } from "./simulationCostCalculator"
export type { SimulationCostEstimate } from "./simulationCostCalculator"
```

## Database View Required
The implementation relies on the `api_call_costs` view to fetch pricing:

```sql
CREATE OR REPLACE VIEW api_call_costs AS
SELECT
  s.id,
  (s."googleMapsKey"::jsonb ->> 'tarif')::numeric AS google_maps_cost_per_call,
  (s."googlePlacesKey"::jsonb ->> 'tarif')::numeric AS google_places_cost_per_call,
  (s."streetViewKey"::jsonb ->> 'tarif')::numeric AS street_view_cost_per_call,
  (s."geminiNanoKey"::jsonb ->> 'tarif')::numeric AS gemini_nano_cost_per_call,
  (s."geminiNanoImageKey"::jsonb ->> 'tarif')::numeric AS gemini_nano_image_cost_per_call,
  s.created_at
FROM app_setting s;
```

## Flow Diagram

```
User clicks "Créer une simulation"
    ↓
Check simulationCostEstimate.hasEnoughCredits
    ↓
    ├─ NO → Show error toast + disable button
    │
    └─ YES → Call GeminiSimulationService.generateSimulation()
              ↓
              Load cost estimate from settings
              ↓
              Validate credits again (server-side)
              ↓
              Charge credits via CreditLedger
              ↓
              Generate image with Gemini API
              ↓
              Return blob URL for display
              ↓
              Store image in background
```

## Credit Calculation

```
API Cost (from settings): $0.0025 per image
Dollars per Token: $0.04
Credits Required = ceil($0.0025 / $0.04) = ceil(0.0625) = 1 credit
```

## Testing Checklist

- [ ] User with sufficient credits can generate simulation
- [ ] User with insufficient credits sees error and disabled button
- [ ] Credits are deducted after successful generation
- [ ] Credit ledger entry is created with correct metadata
- [ ] Cost estimate updates when user credit balance changes
- [ ] Error handling when settings are unavailable (uses defaults)
- [ ] UI shows correct credit cost in badge

## Future Enhancements

1. **Refund on Failure:** If image generation fails after charging, refund credits
2. **Cost Preview:** Show cost estimate before user clicks button
3. **Bulk Discounts:** Apply discounts for generating multiple simulations
4. **Credit Top-up Link:** Add link to subscription page when insufficient credits
