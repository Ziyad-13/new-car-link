package com.ziyad.carlinkit

import com.google.android.gms.maps.model.LatLng
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * Works out which step of a route the driver is currently on, and how far the
 * next turn is.
 *
 * Deliberately simple: it advances when the driver passes the end of a step,
 * and never rewinds. There is no off-route detection or re-routing here — that
 * needs a proper navigation engine, and pretending otherwise would be worse
 * than the honest limitation.
 */
object NavigationTracker {

    data class Guidance(
        val instruction: String,
        val maneuver: String,
        val distanceToTurnMeters: Int,
        val stepIndex: Int,
        val isFinal: Boolean,
        /** Metres from the route line — large values mean we have left it. */
        val offRouteMeters: Int
    )

    /**
     * How far off the line counts as "no longer on this route".
     *
     * Generous on purpose: GPS on a head unit drifts, dual carriageways sit
     * tens of metres apart, and a needless re-route is more disruptive than a
     * moment of stale guidance.
     */
    const val OFF_ROUTE_THRESHOLD_METERS = 70

    /**
     * @param stepFloor never return a step before this, so a GPS wobble cannot
     *                  send the driver back to a turn already taken.
     */
    fun guidanceFor(route: Route, position: LatLng, stepFloor: Int): Guidance? {
        if (route.steps.isEmpty()) return null

        // Pick the step whose end is still ahead and whose start is nearest.
        var best = stepFloor.coerceIn(0, route.steps.lastIndex)
        var bestDistance = Double.MAX_VALUE

        for (i in best..route.steps.lastIndex) {
            val step = route.steps[i]
            val toEnd = haversine(position, step.end)
            // Treat a step as passed once we are within 25 m of its end.
            if (toEnd < 25 && i < route.steps.lastIndex) continue
            val d = distanceToSegment(position, step.start, step.end)
            if (d < bestDistance) {
                bestDistance = d
                best = i
            }
        }

        val step = route.steps[best]

        // Distance to the route as drawn, not merely to this step: after a
        // wrong turn the nearest step can still be close while the driver is
        // plainly somewhere else.
        val offRoute = distanceToPolyline(position, route.points)

        return Guidance(
            instruction = step.instruction,
            maneuver = step.maneuver,
            distanceToTurnMeters = haversine(position, step.end).toInt(),
            stepIndex = best,
            isFinal = best == route.steps.lastIndex,
            offRouteMeters = offRoute.toInt()
        )
    }

    /** Shortest distance from a point to any segment of the route line. */
    private fun distanceToPolyline(p: LatLng, points: List<LatLng>): Double {
        if (points.size < 2) return Double.MAX_VALUE
        var min = Double.MAX_VALUE
        for (i in 0 until points.lastIndex) {
            val d = distanceToSegment(p, points[i], points[i + 1])
            if (d < min) min = d
        }
        return min
    }

    /** Metres between two points on the earth's surface. */
    fun haversine(a: LatLng, b: LatLng): Double {
        val r = 6_371_000.0
        val dLat = Math.toRadians(b.latitude - a.latitude)
        val dLon = Math.toRadians(b.longitude - a.longitude)
        val lat1 = Math.toRadians(a.latitude)
        val lat2 = Math.toRadians(b.latitude)
        val h = sin(dLat / 2) * sin(dLat / 2) +
            sin(dLon / 2) * sin(dLon / 2) * cos(lat1) * cos(lat2)
        return 2 * r * atan2(sqrt(h), sqrt(1 - h))
    }

    /** Perpendicular distance from a point to a route segment, in metres. */
    private fun distanceToSegment(p: LatLng, a: LatLng, b: LatLng): Double {
        // Flat approximation is fine over the length of a single step.
        val ax = a.longitude
        val ay = a.latitude
        val bx = b.longitude
        val by = b.latitude
        val px = p.longitude
        val py = p.latitude

        val dx = bx - ax
        val dy = by - ay
        if (dx == 0.0 && dy == 0.0) return haversine(p, a)

        val t = (((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))
            .coerceIn(0.0, 1.0)
        val nearest = LatLng(ay + t * dy, ax + t * dx)
        return haversine(p, nearest)
    }

    /** "400 m" / "1.2 km" — rounded the way a driver reads it. */
    fun formatDistance(meters: Int): String = when {
        meters < 20 -> "now"
        meters < 1000 -> "${(meters / 10) * 10} m"
        else -> String.format("%.1f km", meters / 1000.0)
    }
}
