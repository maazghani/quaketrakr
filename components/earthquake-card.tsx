import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Activity } from "lucide-react"
import type { Earthquake } from "@/lib/types"

interface EarthquakeCardProps {
  earthquake: Earthquake
}

function getMagnitudeColor(magnitude: number): string {
  if (magnitude >= 7) return "bg-destructive text-destructive-foreground"
  if (magnitude >= 6) return "bg-orange-500 text-white"
  if (magnitude >= 5) return "bg-amber-500 text-white"
  if (magnitude >= 4) return "bg-yellow-500 text-black"
  if (magnitude >= 3) return "bg-lime-500 text-black"
  return "bg-green-500 text-white"
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
}

export function EarthquakeCard({ earthquake }: EarthquakeCardProps) {
  const { properties, geometry } = earthquake
  const [longitude, latitude, depth] = geometry.coordinates

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <Badge className={`${getMagnitudeColor(properties.mag)} font-bold text-base px-3 py-1`}>
                M {properties.mag.toFixed(1)}
              </Badge>
              <div className="flex-1">
                <h3 className="font-semibold text-lg leading-tight mb-1">{properties.place}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatTime(properties.time)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>
                      {latitude.toFixed(2)}°, {longitude.toFixed(2)}°
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" />
                    <span>Depth: {depth.toFixed(1)} km</span>
                  </div>
                </div>
              </div>
            </div>

            {properties.tsunami === 1 && (
              <Badge variant="destructive" className="w-fit">
                Tsunami Warning
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
