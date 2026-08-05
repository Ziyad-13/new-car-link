package com.ziyad.carlinkit.ui.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.unit.dp

/**
 * "Mesa" — the launcher's own icon set, ported from the design deliverable.
 *
 * 2dp stroke on a 20dp optical square: Material Rounded ships 1.5dp, which
 * disappears through the head unit's anti-glare layer. Transport glyphs are
 * solid so the play row reads as physical mass; navigation and utility glyphs
 * are outline. One optical size, no per-size redraws.
 *
 * Paths are parsed from the original SVG data, so the shapes are the
 * designer's exactly rather than an approximation.
 */
object MesaIcons {

    private fun icon(
        name: String,
        build: ImageVector.Builder.() -> Unit
    ): ImageVector = ImageVector.Builder(
        name = name,
        defaultWidth = 24.dp,
        defaultHeight = 24.dp,
        viewportWidth = 24f,
        viewportHeight = 24f
    ).apply(build).build()

    private fun ImageVector.Builder.stroked(
        data: String,
        width: Float = 2f,
        cap: StrokeCap = StrokeCap.Round,
        join: StrokeJoin = StrokeJoin.Round
    ) = addPath(
        pathData = PathParser().parsePathString(data).toNodes(),
        stroke = SolidColor(Color.Black),
        strokeLineWidth = width,
        strokeLineCap = cap,
        strokeLineJoin = join
    )

    private fun ImageVector.Builder.filled(data: String) = addPath(
        pathData = PathParser().parsePathString(data).toNodes(),
        fill = SolidColor(Color.Black)
    )

    val Navigate: ImageVector by lazy {
        icon("Navigate") {
            stroked("M12 3.5 19 20l-7-3.8L5 20Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M12 3.5 19 20l-7-3.8L5 20Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
        }
    }

    val Apps: ImageVector by lazy {
        icon("Apps") {
            stroked("M5.5,3.5L8.5,3.5Q10.5,3.5 10.5,5.5L10.5,8.5Q10.5,10.5 8.5,10.5L5.5,10.5Q3.5,10.5 3.5,8.5L3.5,5.5Q3.5,3.5 5.5,3.5Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M15.5,3.5L18.5,3.5Q20.5,3.5 20.5,5.5L20.5,8.5Q20.5,10.5 18.5,10.5L15.5,10.5Q13.5,10.5 13.5,8.5L13.5,5.5Q13.5,3.5 15.5,3.5Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M5.5,13.5L8.5,13.5Q10.5,13.5 10.5,15.5L10.5,18.5Q10.5,20.5 8.5,20.5L5.5,20.5Q3.5,20.5 3.5,18.5L3.5,15.5Q3.5,13.5 5.5,13.5Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M15.5,13.5L18.5,13.5Q20.5,13.5 20.5,15.5L20.5,18.5Q20.5,20.5 18.5,20.5L15.5,20.5Q13.5,20.5 13.5,18.5L13.5,15.5Q13.5,13.5 15.5,13.5Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M5.5,3.5L8.5,3.5Q10.5,3.5 10.5,5.5L10.5,8.5Q10.5,10.5 8.5,10.5L5.5,10.5Q3.5,10.5 3.5,8.5L3.5,5.5Q3.5,3.5 5.5,3.5Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M15.5,3.5L18.5,3.5Q20.5,3.5 20.5,5.5L20.5,8.5Q20.5,10.5 18.5,10.5L15.5,10.5Q13.5,10.5 13.5,8.5L13.5,5.5Q13.5,3.5 15.5,3.5Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M5.5,13.5L8.5,13.5Q10.5,13.5 10.5,15.5L10.5,18.5Q10.5,20.5 8.5,20.5L5.5,20.5Q3.5,20.5 3.5,18.5L3.5,15.5Q3.5,13.5 5.5,13.5Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M15.5,13.5L18.5,13.5Q20.5,13.5 20.5,15.5L20.5,18.5Q20.5,20.5 18.5,20.5L15.5,20.5Q13.5,20.5 13.5,18.5L13.5,15.5Q13.5,13.5 15.5,13.5Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
        }
    }

    val Album: ImageVector by lazy {
        icon("Album") {
            stroked("M3.5,12.0a8.5,8.5 0 1,0 17.0,0a8.5,8.5 0 1,0 -17.0,0Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            filled("M10.0,12.0a2.0,2.0 0 1,0 4.0,0a2.0,2.0 0 1,0 -4.0,0Z")
            stroked("M3.5,12.0a8.5,8.5 0 1,0 17.0,0a8.5,8.5 0 1,0 -17.0,0Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            filled("M10.0,12.0a2.0,2.0 0 1,0 4.0,0a2.0,2.0 0 1,0 -4.0,0Z")
        }
    }

    val Play: ImageVector by lazy {
        icon("Play") {
            stroked("M9.5 6.5v11l9-5.5z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M9.5 6.5v11l9-5.5z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
        }
    }

    val Pause: ImageVector by lazy {
        icon("Pause") {
            stroked("M9.4,6.5L9.4,6.5Q10.8,6.5 10.8,7.9L10.8,16.1Q10.8,17.5 9.4,17.5L9.4,17.5Q8.0,17.5 8.0,16.1L8.0,7.9Q8.0,6.5 9.4,6.5Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M14.6,6.5L14.6,6.5Q16.0,6.5 16.0,7.9L16.0,16.1Q16.0,17.5 14.6,17.5L14.6,17.5Q13.2,17.5 13.2,16.1L13.2,7.9Q13.2,6.5 14.6,6.5Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M9.4,6.5L9.4,6.5Q10.8,6.5 10.8,7.9L10.8,16.1Q10.8,17.5 9.4,17.5L9.4,17.5Q8.0,17.5 8.0,16.1L8.0,7.9Q8.0,6.5 9.4,6.5Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M14.6,6.5L14.6,6.5Q16.0,6.5 16.0,7.9L16.0,16.1Q16.0,17.5 14.6,17.5L14.6,17.5Q13.2,17.5 13.2,16.1L13.2,7.9Q13.2,6.5 14.6,6.5Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
        }
    }

    val SkipNext: ImageVector by lazy {
        icon("SkipNext") {
            stroked("M7 7v10l8-5z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M17 7v10", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M7 7v10l8-5z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M17 7v10", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
        }
    }

    val SkipPrevious: ImageVector by lazy {
        icon("SkipPrevious") {
            stroked("M17 7v10l-8-5z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M7 7v10", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M17 7v10l-8-5z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M7 7v10", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
        }
    }

    val Home: ImageVector by lazy {
        icon("Home") {
            stroked("M4.5 10.5 12 4.5l7.5 6V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M10 20.5v-5h4v5", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M4.5 10.5 12 4.5l7.5 6V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M10 20.5v-5h4v5", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
        }
    }

    val Work: ImageVector by lazy {
        icon("Work") {
            stroked("M6.5,8.0L17.5,8.0Q20.0,8.0 20.0,10.5L20.0,16.5Q20.0,19.0 17.5,19.0L6.5,19.0Q4.0,19.0 4.0,16.5L4.0,10.5Q4.0,8.0 6.5,8.0Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M6.5,8.0L17.5,8.0Q20.0,8.0 20.0,10.5L20.0,16.5Q20.0,19.0 17.5,19.0L6.5,19.0Q4.0,19.0 4.0,16.5L4.0,10.5Q4.0,8.0 6.5,8.0Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
        }
    }

    val Fuel: ImageVector by lazy {
        icon("Fuel") {
            stroked("M6.0,4.5L11.0,4.5Q13.0,4.5 13.0,6.5L13.0,17.5Q13.0,19.5 11.0,19.5L6.0,19.5Q4.0,19.5 4.0,17.5L4.0,6.5Q4.0,4.5 6.0,4.5Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M7.5,7.0L9.5,7.0Q10.5,7.0 10.5,8.0L10.5,9.5Q10.5,10.5 9.5,10.5L7.5,10.5Q6.5,10.5 6.5,9.5L6.5,8.0Q6.5,7.0 7.5,7.0Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M13 10.5h2a2 2 0 0 1 2 2v4a1.75 1.75 0 0 0 3.5 0V9L18 6.5", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M6.0,4.5L11.0,4.5Q13.0,4.5 13.0,6.5L13.0,17.5Q13.0,19.5 11.0,19.5L6.0,19.5Q4.0,19.5 4.0,17.5L4.0,6.5Q4.0,4.5 6.0,4.5Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M7.5,7.0L9.5,7.0Q10.5,7.0 10.5,8.0L10.5,9.5Q10.5,10.5 9.5,10.5L7.5,10.5Q6.5,10.5 6.5,9.5L6.5,8.0Q6.5,7.0 7.5,7.0Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M13 10.5h2a2 2 0 0 1 2 2v4a1.75 1.75 0 0 0 3.5 0V9L18 6.5", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
        }
    }

    val Search: ImageVector by lazy {
        icon("Search") {
            stroked("M4.5,11.0a6.5,6.5 0 1,0 13.0,0a6.5,6.5 0 1,0 -13.0,0Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M15.8 15.8 20 20", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M4.5,11.0a6.5,6.5 0 1,0 13.0,0a6.5,6.5 0 1,0 -13.0,0Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M15.8 15.8 20 20", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
        }
    }

    val Expand: ImageVector by lazy {
        icon("Expand") {
            stroked("M9 4.5H6A1.5 1.5 0 0 0 4.5 6v3", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M15 4.5h3A1.5 1.5 0 0 1 19.5 6v3", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M4.5 15v3A1.5 1.5 0 0 0 6 19.5h3", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M19.5 15v3a1.5 1.5 0 0 1-1.5 1.5h-3", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M9 4.5H6A1.5 1.5 0 0 0 4.5 6v3", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M15 4.5h3A1.5 1.5 0 0 1 19.5 6v3", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M4.5 15v3A1.5 1.5 0 0 0 6 19.5h3", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M19.5 15v3a1.5 1.5 0 0 1-1.5 1.5h-3", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
        }
    }

    val Equaliser: ImageVector by lazy {
        icon("Equaliser") {
            stroked("M7 4.5v5M7 14.5v5M12 4.5v9M12 18.5v1M17 4.5v1M17 10.5v9", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M4.5 12h5M9.5 16.5h5M14.5 8h5", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M7 4.5v5M7 14.5v5M12 4.5v9M12 18.5v1M17 4.5v1M17 10.5v9", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M4.5 12h5M9.5 16.5h5M14.5 8h5", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
        }
    }

    val Settings: ImageVector by lazy {
        icon("Settings") {
            stroked("M8.6,12.0a3.4,3.4 0 1,0 6.8,0a3.4,3.4 0 1,0 -6.8,0Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M3.5,12.0a8.5,8.5 0 1,0 17.0,0a8.5,8.5 0 1,0 -17.0,0Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M8.6,12.0a3.4,3.4 0 1,0 6.8,0a3.4,3.4 0 1,0 -6.8,0Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M3.5,12.0a8.5,8.5 0 1,0 17.0,0a8.5,8.5 0 1,0 -17.0,0Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
        }
    }

    val Wifi: ImageVector by lazy {
        icon("Wifi") {
            stroked("M3.5 9.5a13 13 0 0 1 17 0", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M6.8 13.2a8.2 8.2 0 0 1 10.4 0", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            filled("M10.4,18.0a1.6,1.6 0 1,0 3.2,0a1.6,1.6 0 1,0 -3.2,0Z")
            stroked("M3.5 9.5a13 13 0 0 1 17 0", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M6.8 13.2a8.2 8.2 0 0 1 10.4 0", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            filled("M10.4,18.0a1.6,1.6 0 1,0 3.2,0a1.6,1.6 0 1,0 -3.2,0Z")
        }
    }

    val Day: ImageVector by lazy {
        icon("Day") {
            stroked("M7.4,12.0a4.6,4.6 0 1,0 9.2,0a4.6,4.6 0 1,0 -9.2,0Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3 17 7M7 17l-1.7 1.7", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M7.4,12.0a4.6,4.6 0 1,0 9.2,0a4.6,4.6 0 1,0 -9.2,0Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3 17 7M7 17l-1.7 1.7", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
        }
    }

    val Night: ImageVector by lazy {
        icon("Night") {
            stroked("M20 14.4A8.6 8.6 0 0 1 9.6 4 8.5 8.5 0 1 0 20 14.4Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            stroked("M20 14.4A8.6 8.6 0 0 1 9.6 4 8.5 8.5 0 1 0 20 14.4Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
        }
    }

    val Auto: ImageVector by lazy {
        icon("Auto") {
            stroked("M3.5,12.0a8.5,8.5 0 1,0 17.0,0a8.5,8.5 0 1,0 -17.0,0Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            filled("M12 3.5a8.5 8.5 0 0 1 0 17Z")
            stroked("M3.5,12.0a8.5,8.5 0 1,0 17.0,0a8.5,8.5 0 1,0 -17.0,0Z", 2.0f, StrokeCap.Butt, StrokeJoin.Miter)
            filled("M12 3.5a8.5 8.5 0 0 1 0 17Z")
        }
    }

}
