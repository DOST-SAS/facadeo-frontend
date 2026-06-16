# Image Selection Feature for Facade Simulation

## Overview
Implemented functionality that allows users to select from multiple Street View images when creating a facade simulation in the devis (quote) creation flow.

## Implementation Details

### State Management
Added three new state variables:
- `selectedImageIndex`: Tracks the currently selected image (default: 0)
- `availableImages`: Array of image URLs parsed from `facade.streetview_url`
- `isImageSelectorOpen`: Controls the popover visibility

### Key Features

#### 1. Automatic Image Loading
When facade data is fetched, the component:
- Parses the `streetview_url` JSON array
- Populates `availableImages` state
- Defaults to the first image (index 0)

#### 2. On-Demand Image Selector UI
The image selector appears in a popover when clicking the Images icon:
- **Icon Button**: Only visible on hover over the "before" image (when multiple images exist)
- **Popover Interface**: Clean, focused UI that doesn't clutter the main view
- **Thumbnail Grid**: Displays all available images in a responsive grid (2-4 columns)
- **Visual Feedback**: Selected image has primary border, shadow, and checkmark overlay
- **Hover Effects**: Scale animation on hover for better UX
- **Image Counter**: Shows current selection in the label (e.g., "Image 2/5")
- **Auto-close**: Popover closes automatically after selection

#### 3. Real-time Updates
- Clicking a thumbnail immediately updates the "Avant (originale)" preview
- Selected image is used in PDF generation
- Selected image is used for AI simulation generation

#### 4. Integration Points
The selected image is used in:
- **PDF Generation**: Both draft and final devis PDFs
- **AI Simulation**: When generating the "after" simulation
- **Preview Display**: The before/after comparison section

### UI/UX Enhancements

#### Visual Design
- **Hover-to-reveal**: Icon button appears only on hover, keeping UI clean
- **Floating Button**: Positioned in top-right corner with shadow and primary accent
- **Popover Layout**: Wide, scrollable popover with max-height for many images
- **Thumbnail Grid**: Aspect-ratio preserved, responsive (2-4 columns)
- **Primary Highlighting**: Selected image clearly marked with border and checkmark
- **Smooth Transitions**: Scale animations and opacity changes

#### Accessibility
- Semantic button elements for all interactive components
- Clear visual indicators for selection state
- Image numbering badges for easy reference
- Descriptive alt text and titles
- Keyboard-accessible popover

#### Edge Cases Handled
- **Single image**: Icon button hidden entirely, first image used automatically
- **No images**: Fallback to placeholder image
- **Invalid JSON**: Error handling with console logging
- **Many images**: Scrollable popover with max-height constraint

## Code Changes

### Modified Functions
1. `fetchFacade()` - Added image parsing and state initialization
2. `handleCreateDevis()` - Uses selected image for PDF generation
3. `handleGenerateSimulation()` - Uses selected image for AI simulation
4. `handleDownloadPdf()` - Uses selected image in fallback PDF generation

### New UI Components
Added image selector system in the "Comparaison avant/après" card:
- **Floating Icon Button**: Appears on hover over the "before" image (only if multiple images)
- **Popover Component**: Contains the thumbnail grid selector
- **Conditional Rendering**: Based on image count (hidden for single image)
- **Seamless Integration**: Doesn't disrupt existing comparison layout

## Testing Recommendations

1. **Single Image**: Verify icon button is hidden, first image used
2. **Multiple Images**: 
   - Hover over image to reveal icon button
   - Click icon to open popover
   - Select different images and verify preview updates
   - Verify popover closes after selection
3. **PDF Generation**: Confirm selected image appears in PDF
4. **AI Simulation**: Verify simulation uses selected image
5. **Responsive Design**: Test popover on mobile, tablet, desktop
6. **Edge Cases**: Test with no images, invalid JSON
7. **Hover Behavior**: Verify icon appears/disappears smoothly on hover

## Future Enhancements (Optional)

- Image zoom/preview on hover
- Keyboard navigation for image selection
- Image quality indicators
- Ability to upload custom images
- Image comparison slider for before/after
