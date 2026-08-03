package com.ziyad.carlinkit.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Minimal QR encoder (byte mode, error correction level L).
 *
 * Written by hand rather than pulling in a barcode library: the launcher needs
 * to encode one short local URL, and a full library would add ~600 KB for that.
 */
object QrEncoder {

    /** Returns a square matrix where true = dark module, or null if too long. */
    fun encode(text: String): Array<BooleanArray>? {
        val data = text.toByteArray(Charsets.UTF_8)
        // Version 5 (37x37) at EC level L holds 106 bytes — ample for a URL.
        val version = when {
            data.size <= 17 -> 1
            data.size <= 32 -> 2
            data.size <= 53 -> 3
            data.size <= 78 -> 4
            data.size <= 106 -> 5
            else -> return null
        }
        val size = 17 + version * 4
        val totalCodewords = when (version) {
            1 -> 19; 2 -> 34; 3 -> 55; 4 -> 80; else -> 108
        }
        val ecCodewords = when (version) {
            1 -> 7; 2 -> 10; 3 -> 15; 4 -> 20; else -> 26
        }

        // ── Bit stream: mode, length, payload, terminator, padding ──
        val bits = ArrayList<Boolean>()
        fun put(value: Int, length: Int) {
            for (i in length - 1 downTo 0) bits.add((value shr i) and 1 == 1)
        }
        put(0b0100, 4)                       // byte mode
        put(data.size, if (version < 10) 8 else 16)
        data.forEach { put(it.toInt() and 0xFF, 8) }

        val capacityBits = totalCodewords * 8
        repeat(minOf(4, capacityBits - bits.size)) { bits.add(false) }
        while (bits.size % 8 != 0) bits.add(false)

        val codewords = ArrayList<Int>()
        for (i in bits.indices step 8) {
            var b = 0
            for (j in 0 until 8) if (bits[i + j]) b = b or (1 shl (7 - j))
            codewords.add(b)
        }
        var pad = true
        while (codewords.size < totalCodewords) {
            codewords.add(if (pad) 0xEC else 0x11)
            pad = !pad
        }

        val withEc = codewords + reedSolomon(codewords, ecCodewords)

        // ── Place modules ──
        val matrix = Array(size) { BooleanArray(size) }
        val reserved = Array(size) { BooleanArray(size) }

        fun finder(row: Int, col: Int) {
            for (r in -1..7) for (c in -1..7) {
                val rr = row + r
                val cc = col + c
                if (rr !in 0 until size || cc !in 0 until size) continue
                val dark = (r in 0..6 && (c == 0 || c == 6)) ||
                        (c in 0..6 && (r == 0 || r == 6)) ||
                        (r in 2..4 && c in 2..4)
                matrix[rr][cc] = dark
                reserved[rr][cc] = true
            }
        }
        finder(0, 0); finder(0, size - 7); finder(size - 7, 0)

        // Timing patterns
        for (i in 8 until size - 8) {
            val dark = i % 2 == 0
            matrix[6][i] = dark; reserved[6][i] = true
            matrix[i][6] = dark; reserved[i][6] = true
        }

        // Alignment pattern (versions 2+)
        if (version >= 2) {
            val pos = size - 7
            for (r in -2..2) for (c in -2..2) {
                val dark = r == -2 || r == 2 || c == -2 || c == 2 || (r == 0 && c == 0)
                matrix[pos + r][pos + c] = dark
                reserved[pos + r][pos + c] = true
            }
        }

        // Dark module + format areas
        matrix[size - 8][8] = true
        reserved[size - 8][8] = true
        for (i in 0..8) {
            if (i != 6) { reserved[8][i] = true; reserved[i][8] = true }
        }
        for (i in 0..7) reserved[size - 1 - i][8] = true
        for (i in 0..7) reserved[8][size - 1 - i] = true

        // ── Zigzag data placement, mask 0 ──
        var bitIndex = 0
        val dataBits = ArrayList<Boolean>()
        withEc.forEach { cw -> for (i in 7 downTo 0) dataBits.add((cw shr i) and 1 == 1) }

        var col = size - 1
        var upward = true
        while (col > 0) {
            if (col == 6) col--
            val rows = if (upward) (size - 1) downTo 0 else 0 until size
            for (row in rows) {
                for (c in 0..1) {
                    val cc = col - c
                    if (reserved[row][cc]) continue
                    var dark = bitIndex < dataBits.size && dataBits[bitIndex]
                    bitIndex++
                    if ((row + cc) % 2 == 0) dark = !dark   // mask 0
                    matrix[row][cc] = dark
                }
            }
            upward = !upward
            col -= 2
        }

        // Format info for EC level L, mask 0
        val format = 0b111011111000100
        for (i in 0..5) matrix[8][i] = (format shr (14 - i)) and 1 == 1
        matrix[8][7] = (format shr 8) and 1 == 1
        matrix[8][8] = (format shr 7) and 1 == 1
        matrix[7][8] = (format shr 6) and 1 == 1
        for (i in 9..14) matrix[14 - i][8] = (format shr (14 - i)) and 1 == 1
        for (i in 0..7) matrix[size - 1 - i][8] = (format shr i) and 1 == 1
        for (i in 8..14) matrix[8][size - 15 + i] = (format shr i) and 1 == 1

        return matrix
    }

    /** Reed–Solomon error correction codewords over GF(256). */
    private fun reedSolomon(data: List<Int>, ecLen: Int): List<Int> {
        val expTable = IntArray(512)
        val logTable = IntArray(256)
        var x = 1
        for (i in 0 until 255) {
            expTable[i] = x
            logTable[x] = i
            x = x shl 1
            if (x and 0x100 != 0) x = x xor 0x11D
        }
        for (i in 255 until 512) expTable[i] = expTable[i - 255]

        fun mul(a: Int, b: Int) =
            if (a == 0 || b == 0) 0 else expTable[logTable[a] + logTable[b]]

        var generator = intArrayOf(1)
        for (i in 0 until ecLen) {
            val next = IntArray(generator.size + 1)
            for (j in generator.indices) {
                next[j] = next[j] xor generator[j]
                next[j + 1] = next[j + 1] xor mul(generator[j], expTable[i])
            }
            generator = next
        }

        val remainder = IntArray(ecLen)
        for (byte in data) {
            val factor = byte xor remainder[0]
            for (i in 0 until ecLen - 1) remainder[i] = remainder[i + 1]
            remainder[ecLen - 1] = 0
            for (i in 0 until ecLen) {
                remainder[i] = remainder[i] xor mul(generator[i + 1], factor)
            }
        }
        return remainder.toList()
    }
}

/** Renders a QR matrix. */
@Composable
fun QrCode(
    content: String,
    size: Dp,
    dark: Color = Color.Black,
    light: Color = Color.White,
    modifier: Modifier = Modifier
) {
    val matrix = remember(content) { QrEncoder.encode(content) } ?: return

    Canvas(modifier = modifier.size(size)) {
        val quiet = 2
        val modules = matrix.size + quiet * 2
        val cell = this.size.width / modules

        drawRect(color = light, size = this.size)
        for (r in matrix.indices) {
            for (c in matrix[r].indices) {
                if (matrix[r][c]) {
                    drawRect(
                        color = dark,
                        topLeft = Offset((c + quiet) * cell, (r + quiet) * cell),
                        size = Size(cell, cell)
                    )
                }
            }
        }
    }
}
