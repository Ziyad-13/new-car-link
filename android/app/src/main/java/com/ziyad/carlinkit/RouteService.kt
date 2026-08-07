package com.ziyad.carlinkit

import com.google.android.gms.maps.model.LatLng
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

/**
 * A route drawn on the launcher's own map, rather than handing the driver off
 * to another app.
 */
/** One turn in the route: what to do, where, and how far away it is. */
data class RouteStep(
    val instruction: String,
    val maneuver: String,
    val start: LatLng,
    val end: LatLng,
    val distanceMeters: Int,
    val distanceText: String
)

data class Route(
    val points: List<LatLng>,
    val destination: LatLng,
    val destinationName: String,
    val distanceText: String,
    val durationText: String,
    val durationSeconds: Int,
    val steps: List<RouteStep> = emptyList()
)

object RouteService {

    /**
     * Turn a pasted maps link into something the Directions API accepts.
     *
     * Phones share places as links, not names — the short goo.gl/maps form has
     * to be followed to its target, and coordinates buried in the URL are far
     * more precise than the place name.
     */
    suspend fun resolveDestination(input: String): String = withContext(Dispatchers.IO) {
        val text = input.trim()
        if (!text.startsWith("http", ignoreCase = true)) return@withContext text

        val expanded = try {
            if (text.contains("goo.gl") || text.contains("maps.app") ||
                text.contains("g.co") || text.contains("bit.ly")
            ) {
                val conn = (URL(text).openConnection() as HttpURLConnection).apply {
                    instanceFollowRedirects = false
                    connectTimeout = 8000
                    readTimeout = 8000
                    requestMethod = "HEAD"
                    setRequestProperty("User-Agent", "Mozilla/5.0")
                }
                val location = conn.getHeaderField("Location")
                conn.disconnect()
                location ?: text
            } else {
                text
            }
        } catch (_: Throwable) {
            text
        }

        // Prefer explicit coordinates wherever they appear in the URL
        Regex("""[@!/=](-?\d{1,3}\.\d{4,}),(-?\d{1,3}\.\d{4,})""")
            .find(expanded)
            ?.let { return@withContext it.groupValues[1] + "," + it.groupValues[2] }

        Regex("""[?&]q=([^&]+)""").find(expanded)?.let {
            return@withContext java.net.URLDecoder.decode(it.groupValues[1], "UTF-8")
        }

        Regex("""/place/([^/@?]+)""").find(expanded)?.let {
            return@withContext java.net.URLDecoder.decode(it.groupValues[1], "UTF-8")
                .replace('+', ' ')
        }

        expanded
    }

    /** Last failure reason from the API, shown on screen for diagnosis. */
    @Volatile
    var lastError: String? = null
        private set

    /**
     * Ask the Directions API for a driving route from [origin] to [query].
     * Returns null when the key is missing, the network fails, or no route
     * exists — the caller shows the map unchanged rather than a broken state.
     */
    /**
     * Every route the API offered, best first. The single-route [fetchRoute]
     * remains for callers that do not offer a choice.
     */
    suspend fun fetchRoutes(origin: LatLng, query: String): List<Route> =
        withContext(Dispatchers.IO) {
            val key = BuildConfig.DIRECTIONS_KEY
            if (key.isBlank() || query.isBlank()) return@withContext emptyList()
            try {
                val target = geocodeNearby(origin, query, key) ?: query
                val url = buildString {
                    append("https://maps.googleapis.com/maps/api/directions/json")
                    append("?origin=").append(origin.latitude).append(',').append(origin.longitude)
                    append("&destination=").append(URLEncoder.encode(target, "UTF-8"))
                    append("&mode=driving")
                    append("&language=ar&region=sa")
                    append("&key=").append(key)
                }
                val conn = (URL(url).openConnection() as HttpURLConnection).apply {
                    connectTimeout = 8000
                    readTimeout = 8000
                }
                val body = conn.inputStream.bufferedReader().use { it.readText() }
                conn.disconnect()
                val json = JSONObject(body)
                if (json.optString("status") != "OK") {
                    lastError = json.optString("error_message")
                        .ifBlank { json.optString("status") }
                    return@withContext emptyList()
                }
                lastError = null
                val arr = json.getJSONArray("routes")
                (0 until minOf(arr.length(), 1)).mapNotNull { i ->
                    parseRoute(arr.getJSONObject(i), query)
                }
            } catch (t: Throwable) {
                lastError = t.javaClass.simpleName + ": " + (t.message ?: "")
                emptyList()
            }
        }

    /**
     * Resolve a place name to coordinates *near the driver*.
     *
     * Without this, Directions interprets a bare name with no geographic
     * anchor and can land anywhere in the country. Biasing by current position
     * is what makes "the nearest pharmacy" mean the nearest one to us.
     */
    private fun geocodeNearby(origin: LatLng, query: String, key: String): String? {
        // Already coordinates: use them as-is.
        if (Regex("""^-?\d{1,3}\.\d+,\s*-?\d{1,3}\.\d+$""").matches(query.trim())) {
            return query.trim().replace(" ", "")
        }
        return try {
            val url = buildString {
                append("https://maps.googleapis.com/maps/api/place/textsearch/json")
                append("?query=").append(URLEncoder.encode(query, "UTF-8"))
                append("&location=").append(origin.latitude).append(',').append(origin.longitude)
                append("&radius=50000")
                append("&region=sa&language=ar")
                append("&key=").append(key)
            }
            val conn = (URL(url).openConnection() as HttpURLConnection).apply {
                connectTimeout = 8000
                readTimeout = 8000
            }
            val body = conn.inputStream.bufferedReader().use { it.readText() }
            conn.disconnect()
            val json = JSONObject(body)
            if (json.optString("status") != "OK") return null
            val first = json.getJSONArray("results").optJSONObject(0) ?: return null
            val loc = first.getJSONObject("geometry").getJSONObject("location")
            loc.getDouble("lat").toString() + "," + loc.getDouble("lng").toString()
        } catch (_: Throwable) {
            null
        }
    }

    suspend fun fetchRoute(origin: LatLng, query: String): Route? =
        withContext(Dispatchers.IO) {
            val key = BuildConfig.DIRECTIONS_KEY
            if (key.isBlank() || query.isBlank()) return@withContext null

            try {
                // Anchor the destination near the driver before routing.
                val target = geocodeNearby(origin, query, key) ?: query

                val url = buildString {
                    append("https://maps.googleapis.com/maps/api/directions/json")
                    append("?origin=").append(origin.latitude).append(',').append(origin.longitude)
                    append("&destination=").append(URLEncoder.encode(target, "UTF-8"))
                    append("&mode=driving")
                    // Keeps a bare place name anchored near the driver even if
                    // the Places lookup above was unavailable.
                    append("&location=").append(origin.latitude).append(',').append(origin.longitude)
                    append("&radius=50000")
                    append("&language=ar")
                    append("&region=sa")
                    append("&key=").append(key)
                }

                val conn = (URL(url).openConnection() as HttpURLConnection).apply {
                    connectTimeout = 8000
                    readTimeout = 8000
                    requestMethod = "GET"
                }
                val body = conn.inputStream.bufferedReader().use { it.readText() }
                conn.disconnect()

                val json = JSONObject(body)
                val status = json.optString("status")
                if (status != "OK") {
                    lastError = json.optString("error_message").ifBlank { status }
                    return@withContext null
                }
                lastError = null

                val route = json.getJSONArray("routes").optJSONObject(0)
                    ?: return@withContext null
                parseRoute(route, query)
            } catch (t: Throwable) {
                lastError = t.javaClass.simpleName + ": " + (t.message ?: "")
                null
            }
        }

    /**
     * Google encodes route geometry as a compressed polyline string; this is
     * the standard decoding algorithm.
     */
    /** Shared parsing for one route object from the Directions response. */
    private fun parseRoute(route: JSONObject, query: String): Route? {
        val leg = route.getJSONArray("legs").optJSONObject(0) ?: return null
        val polyline = route.getJSONObject("overview_polyline").getString("points")
        val endLoc = leg.getJSONObject("end_location")

        val steps = mutableListOf<RouteStep>()
        val stepArray = leg.optJSONArray("steps")
        if (stepArray != null) {
            for (i in 0 until stepArray.length()) {
                val st = stepArray.getJSONObject(i)
                val sl = st.getJSONObject("start_location")
                val el = st.getJSONObject("end_location")
                steps.add(
                    RouteStep(
                        instruction = st.optString("html_instructions")
                            .replace(Regex("<[^>]*>"), " ")
                            .replace(Regex("\\s+"), " ")
                            .trim(),
                        maneuver = st.optString("maneuver"),
                        start = LatLng(sl.getDouble("lat"), sl.getDouble("lng")),
                        end = LatLng(el.getDouble("lat"), el.getDouble("lng")),
                        distanceMeters = st.getJSONObject("distance").getInt("value"),
                        distanceText = st.getJSONObject("distance").getString("text")
                    )
                )
            }
        }

        return Route(
            points = decodePolyline(polyline),
            destination = LatLng(endLoc.getDouble("lat"), endLoc.getDouble("lng")),
            destinationName = leg.optString("end_address", query),
            distanceText = leg.getJSONObject("distance").getString("text"),
            durationText = leg.getJSONObject("duration").getString("text"),
            durationSeconds = leg.getJSONObject("duration").getInt("value"),
            steps = steps
        )
    }

    private fun decodePolyline(encoded: String): List<LatLng> {
        val poly = ArrayList<LatLng>()
        var index = 0
        var lat = 0
        var lng = 0

        while (index < encoded.length) {
            var shift = 0
            var result = 0
            var b: Int
            do {
                b = encoded[index++].code - 63
                result = result or ((b and 0x1f) shl shift)
                shift += 5
            } while (b >= 0x20)
            lat += if (result and 1 != 0) (result shr 1).inv() else result shr 1

            shift = 0
            result = 0
            do {
                b = encoded[index++].code - 63
                result = result or ((b and 0x1f) shl shift)
                shift += 5
            } while (b >= 0x20)
            lng += if (result and 1 != 0) (result shr 1).inv() else result shr 1

            poly.add(LatLng(lat / 1E5, lng / 1E5))
        }
        return poly
    }
}
