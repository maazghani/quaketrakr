"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { Activity, TrendingUp, MapPin, AlertTriangle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { StatsCard } from "@/components/stats-card"
import { EarthquakeCard } from "@/components/earthquake-card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { EarthquakeResponse, TimeFrame, FilterState } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const timeframeConfig = {
  hour: { label: "Past Hour", endpoint: "all_hour" },
  day: { label: "Past Day", endpoint: "all_day" },
  week: { label: "Past Week", endpoint: "all_week" },
  month: { label: "Past Month", endpoint: "all_month" },
}

export default function QuakeTrakr() {
  const [filters, setFilters] = useState<FilterState>({
    timeframe: "day",
    minMagnitude: 0,
    maxMagnitude: 10,
  })

  const endpoint = timeframeConfig[filters.timeframe].endpoint
  const { data, error, isLoading } = useSWR<EarthquakeResponse>(
    `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${endpoint}.geojson`,
    fetcher,
    { refreshInterval: 60000 },
  )

  const filteredEarthquakes = useMemo(() => {
    if (!data?.features) return []
    return data.features.filter((eq) => {
      const mag = eq.properties.mag
      // Filter out null/undefined magnitudes and apply range filter
      return mag !== null && mag !== undefined && mag >= filters.minMagnitude && mag <= filters.maxMagnitude
    })
  }, [data, filters.minMagnitude, filters.maxMagnitude])

  const stats = useMemo(() => {
    if (!filteredEarthquakes.length) {
      return {
        total: 0,
        avgMagnitude: 0,
        maxMagnitude: 0,
        significant: 0,
      }
    }

    const magnitudes = filteredEarthquakes
      .map((eq) => eq.properties.mag)
      .filter((mag): mag is number => mag !== null && mag !== undefined)

    if (magnitudes.length === 0) {
      return {
        total: filteredEarthquakes.length,
        avgMagnitude: 0,
        maxMagnitude: 0,
        significant: 0,
      }
    }

    return {
      total: filteredEarthquakes.length,
      avgMagnitude: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
      maxMagnitude: Math.max(...magnitudes),
      significant: filteredEarthquakes.filter((eq) => eq.properties.mag !== null && eq.properties.mag >= 5).length,
    }
  }, [filteredEarthquakes])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary p-2">
                <Activity className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">QuakeTrakr</h1>
                <p className="text-sm text-muted-foreground">Real-time earthquake monitoring</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Filters */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Timeframe</h2>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(timeframeConfig) as TimeFrame[]).map((tf) => (
                  <Button
                    key={tf}
                    variant={filters.timeframe === tf ? "default" : "outline"}
                    onClick={() => setFilters({ ...filters, timeframe: tf })}
                  >
                    {timeframeConfig[tf].label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Magnitude Range</h2>
                <span className="text-sm text-muted-foreground">
                  {filters.minMagnitude.toFixed(1)} - {filters.maxMagnitude.toFixed(1)}
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Minimum Magnitude: {filters.minMagnitude.toFixed(1)}
                  </label>
                  <Slider
                    value={[filters.minMagnitude]}
                    onValueChange={([value]) => setFilters({ ...filters, minMagnitude: value })}
                    min={0}
                    max={10}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Maximum Magnitude: {filters.maxMagnitude.toFixed(1)}
                  </label>
                  <Slider
                    value={[filters.maxMagnitude]}
                    onValueChange={([value]) => setFilters({ ...filters, maxMagnitude: value })}
                    min={0}
                    max={10}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="p-6">
              <p className="text-destructive">Failed to load earthquake data. Please try again.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Earthquakes"
              value={stats.total}
              icon={Activity}
              description={timeframeConfig[filters.timeframe].label}
            />
            <StatsCard
              title="Average Magnitude"
              value={stats.avgMagnitude.toFixed(2)}
              icon={TrendingUp}
              description="Mean magnitude"
            />
            <StatsCard
              title="Strongest Quake"
              value={stats.maxMagnitude.toFixed(1)}
              icon={AlertTriangle}
              description="Maximum magnitude"
            />
            <StatsCard
              title="Significant Events"
              value={stats.significant}
              icon={MapPin}
              description="Magnitude ≥ 5.0"
            />
          </div>
        )}

        {/* Earthquake List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recent Earthquakes</h2>
            {data && (
              <p className="text-sm text-muted-foreground">
                Showing {filteredEarthquakes.length} of {data.features.length} earthquakes
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEarthquakes.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No earthquakes found</h3>
                <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredEarthquakes.map((earthquake) => (
                <EarthquakeCard key={earthquake.id} earthquake={earthquake} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Data provided by{" "}
            <a
              href="https://earthquake.usgs.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              USGS Earthquake Hazards Program
            </a>
            . Updates every minute.
          </p>
        </div>
      </footer>
    </div>
  )
}
