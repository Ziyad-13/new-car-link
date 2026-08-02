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
data class Route(
    val points: List<LatLng>,
    val destination: LatLng,
    val destinationName: String,
    val distanceText: String,
    val durationText: String,
    val durationSeconds: Int
)

object RouteService {

    /**
     * Ask the Directions API for a driving route from [origin] to [query].
     * Returns null when the key is missing, the network fails, or no route
     * exists — the caller shows the map unchanged rather than a broken state.
     */
    suspend fun fetchRoute(origin: LatLng, query: String): Route? =
        withContext(Dispatchers.IO) {
            val key = BuildConfig.MAPS_KEY
            if (key.isBlank() || query.isBlank()) return@withContext null

            try {
                val url = buildString {
                    append("https://maps.googleapis.com/maps/api/directions/json")
                    append("?origin=").append(origin.latitude).append(',').append(origin.longitude)
                    append("&destination=").append(URLEncoder.encode(query, "UTF-8"))
                    append("&mode=driving")
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
                if (json.optString("status") != "OK") return@withContext null

                val route = json.getJSONArray("routes").optJSONObject(0)
                    ?: return@withContext null
                val leg = route.getJSONArray("legs").optJSONObject(0)
                    ?: return@withContext null

                val polyline = route.getJSONObject("overview_polyline").getString("points")
                val endLoc = leg.getJSONObject("end_location")

                Route(
                    points = decodePolyline(polyline),
                    destination = LatLng(endLoc.getDouble("lat"), endLoc.getDouble("lng")),
                    destinationName = leg.optString("end_address", query),
                    distanceText = leg.getJSONObject("distance").getString("text"),
                    durationText = leg.getJSONObject("duration").getString("text"),
                    durationSeconds = leg.getJSONObject("duration").getInt("value")
                )
            } catch (_: Throwable) {
                null
            }
        }

    /**
     * Google encodes route geometry as a compressed polyline string; this is
     * the standard decoding algorithm.
     */
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
