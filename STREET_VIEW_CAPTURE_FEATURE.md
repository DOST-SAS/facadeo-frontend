# Street View Image Capture Feature

## Overview
This feature allows users to capture images from Google Street View and save them to the facade's image gallery.

## Implementation Details

### 1. Lightbox Component (`src/components/ui/lightbox.tsx`)
- Modal dialog for image preview
- Confirm/Decline buttons
- Loading state during save operation
- Prevents body scroll when open
- Backdrop blur effect

### 2. Service Methods (`src/services/artisan/scansServices.ts`)

#### `uploadFacadeImage(facadeId: string, imageBlob: Blob): Promise<string>`
- Uploads image to Supabase Storage bucket 'facades'
- Generates unique filename: `facade-{facadeId}-{timestamp}.jpg`
- Returns public URL of uploaded image

#### `updateFacadeStreetviewUrl(facadeId: string, newImageUrl: string): Promise<void>`
- Fetches current `streetview_url` array from database
- Prepends new image URL to the beginning of array
- Updates facade record with new array
- Updates `updated_at` timestamp

### 3. Component Updates (`src/features/Artisan/facades/DetailsFacade.tsx`)

#### New State Variables
- `showLightbox`: Controls lightbox visibility
- `isSavingImage`: Loading state during save operation

#### Event Handlers

**`handleCaptureStreetView()`**
- Captures current Street View panorama using Google Static API
- Retrieves current zoom level from panorama
- Calculates FOV (Field of View) based on zoom: `FOV = 180 / (2^zoom)`
  - Zoom 0 → FOV ~120° (wide angle)
  - Zoom 1 → FOV ~90° (normal)
  - Zoom 2 → FOV ~45° (zoomed in)
  - Zoom 5 → FOV ~10° (maximum zoom)
- Converts to data URL (JPEG, 95% quality)
- Opens lightbox for user confirmation
- Image size: 1280x720px

**`handleConfirmImage()`**
- Converts data URL to Blob
- Uploads to Supabase Storage
- Updates facade `streetview_url` in database
- Refreshes facade data to display new image
- Resets image index to 0 (shows new image first)
- Shows success message

**`handleDeclineImage()`**
- Closes lightbox
- Discards captured image
- No database changes

## User Flow

1. User toggles Street View mode
2. User navigates to desired view/angle
3. User adjusts zoom level (0-5) using zoom controls or mouse wheel
4. User clicks Camera button to capture
5. Lightbox appears with captured image preview (respecting zoom level)
6. User can:
   - **Confirm**: Image is uploaded and saved as first image in gallery
   - **Decline**: Image is discarded, no changes made

## Database Schema

### Storage Bucket
- **Name**: `facades`
- **Path**: `facades/facade-{id}-{timestamp}.jpg`
- **Public**: Yes (public URLs generated)

### Facades Table
- **Column**: `streetview_url` (JSON array of strings)
- **Format**: `["url1", "url2", "url3"]`
- **New images**: Prepended to array (index 0)

## Notes
- Images are stored in JPEG format at 95% quality
- Captured images become the first image in the gallery
- Original Street View images remain in the array
- Storage bucket 'facades' must exist in Supabase
- Requires proper Supabase storage permissions
- **Zoom level is preserved**: The captured image respects the user's zoom level in Street View
- FOV calculation ensures accurate zoom representation in static images
- Street View info overlay displays: Position (lat/lng), Heading, Pitch, and Zoom level
