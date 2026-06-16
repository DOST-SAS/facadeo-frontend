import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function MapDemo() {
  const [currentProvider, setCurrentProvider] = useState(
    import.meta.env.VITE_MAP_CHOICE || 'google'
  )

  const switchProvider = () => {
    // Note: This is just for demonstration
    // In a real app, you'd need to restart the app or reload the page
    // since environment variables are set at build time
    const newProvider = currentProvider === 'google' ? 'mapbox' : 'google'
    setCurrentProvider(newProvider)
    
    // Show instructions to user
    alert(`To switch to ${newProvider}, update VITE_MAP_CHOICE="${newProvider}" in your .env file and restart the development server.`)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Map Provider</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p><strong>Current Provider:</strong> {currentProvider}</p>
          <p className="text-muted-foreground mt-2">
            Set <code>VITE_MAP_CHOICE</code> in your .env file to switch providers.
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 border rounded">
            <span>Google Maps</span>
            {currentProvider === 'google' && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                Active
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between p-2 border rounded">
            <span>Mapbox</span>
            {currentProvider === 'mapbox' && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                Active
              </span>
            )}
          </div>
        </div>

        <Button onClick={switchProvider} variant="outline" className="w-full">
          Switch Provider (Demo)
        </Button>
        
        <div className="text-xs text-muted-foreground">
          <p><strong>Required Environment Variables:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Google: <code>VITE_GOOGLE_MAP_API_KEY</code></li>
            <li>Mapbox: <code>VITE_MAPBOX_ACCESS_TOKEN</code></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}