import { useState, useCallback } from 'react'
import { PlacesService, type FacadeDetectionInput, type FacadeDetectionResult, type FacadeDetectionError } from '@/services/places'
import toast from 'react-hot-toast'

export interface UseFacadeDetectionState {
  isLoading: boolean
  result: FacadeDetectionResult | null
  error: FacadeDetectionError | null
  isFound: boolean
}

export interface UseFacadeDetectionActions {
  detectFacades: (input: FacadeDetectionInput) => Promise<void>
  reset: () => void
  clearError: () => void
}

export type UseFacadeDetectionReturn = UseFacadeDetectionState & UseFacadeDetectionActions

export function useFacadeDetection(): UseFacadeDetectionReturn {
  const [state, setState] = useState<UseFacadeDetectionState>({
    isLoading: false,
    result: null,
    error: null,
    isFound: false
  })

  const detectFacades = useCallback(async (input: FacadeDetectionInput) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }))

    try {
      const result = await PlacesService.detectFacades(input)
      
      console.log('===========================================')
      console.log('=== HOOK RECEIVED RESULT FROM SERVICE ===')
      console.log(`Total facades: ${result.totalFound}`)
      result.facades.forEach((facade, idx) => {
        console.log(`[${idx}] ${facade.name}`)
        console.log(`    coordinates:`, facade.coordinates)
        console.log(`    lat: ${facade.coordinates.lat}`)
        console.log(`    lng: ${facade.coordinates.lng}`)
      })
      console.log('===========================================')
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        result,
        isFound: true,
        error: null
      }))

      // Show success message
      toast.success(`${result.totalFound} façades détectées dans un rayon de ${result.searchRadius}m`)
      
    } catch (error) {
      const facadeError = error as FacadeDetectionError
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: facadeError,
        result: null,
        isFound: false
      }))

      // Show appropriate error message
      switch (facadeError.code) {
        case 'VALIDATION_ERROR':
          toast.error('Paramètres invalides. Vérifiez les coordonnées et le rayon.')
          break
        case 'QUOTA_EXCEEDED':
          toast.error('Quota API dépassé. Réessayez plus tard.')
          break
        case 'NO_RESULTS':
          toast.error('Aucune façade trouvée dans cette zone.')
          break
        case 'NETWORK_ERROR':
          toast.error('Erreur de connexion. Vérifiez votre connexion internet.')
          break
        default:
          toast.error(facadeError.message || 'Erreur lors de la détection des façades.')
      }
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      result: null,
      error: null,
      isFound: false
    })
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }))
  }, [])

  return {
    ...state,
    detectFacades,
    reset,
    clearError
  }
}