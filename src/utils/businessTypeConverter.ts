import { GOOGLE_PLACE_TYPES_I18N } from "@/constants/index";

/**
 * Converts a Google Places type to its French label
 * @param placeType - The Google Places type (e.g., "restaurant", "beauty_salon")
 * @returns The French label for the place type, or the original value if not found
 */
export function getPlaceTypeLabel(placeType: string): string {
  const placeTypeEntry = GOOGLE_PLACE_TYPES_I18N.find(
    (type) => type.value === placeType
  );
  
  return placeTypeEntry ? placeTypeEntry.label : placeType;
}
