package com.ziyad.carlinkit

import android.content.Context
import android.net.wifi.WifiManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.PrintWriter
import java.net.InetAddress
import java.net.NetworkInterface
import java.net.ServerSocket
import java.net.URLDecoder
import kotlin.random.Random

/**
 * A tiny HTTP server so the phone can push a destination to the car.
 *
 * Deliberately minimal: it binds to the local network only, serves one page,
 * accepts one kind of request, and requires a PIN shown on the car screen.
 * It is not an API and should never be exposed beyond the local subnet.
 */
class DestinationServer(private val context: Context) {

    companion object {
        const val PORT = 8719
    }

    private val _pin = MutableStateFlow(Random.nextInt(1000, 9999).toString())
    val pin: StateFlow<String> = _pin

    private val _address = MutableStateFlow<String?>(null)
    val address: StateFlow<String?> = _address

    /** Destination pushed from the phone, consumed once by the UI. */
    private val _incoming = MutableStateFlow<String?>(null)
    val incoming: StateFlow<String?> = _incoming

    private var server: ServerSocket? = null
    private var job: Job? = null
    private val scope = CoroutineScope(Dispatchers.IO)

    fun start() {
        if (job?.isActive == true) return
        job = scope.launch {
            try {
                val socket = ServerSocket(PORT)
                server = socket
                _address.value = "http://${localIp()}:$PORT"

                while (isActive && !socket.isClosed) {
                    try {
                        val client = socket.accept()
                        handle(client)
                    } catch (_: Throwable) {
                        // A failed connection must not kill the listener.
                    }
                }
            } catch (t: Throwable) {
                CrashLog.record(context, "DestinationServer.start", t)
                _address.value = null
            }
        }
    }

    private fun handle(client: java.net.Socket) {
        client.use { sock ->
            val reader = BufferedReader(InputStreamReader(sock.getInputStream()))
            val requestLine = reader.readLine() ?: return
            val writer = PrintWriter(sock.getOutputStream())

            val path = requestLine.split(" ").getOrNull(1) ?: "/"

            when {
                path.startsWith("/go?") -> {
                    val params = parseQuery(path.substringAfter("?"))
                    val sentPin = params["pin"]
                    val destination = params["q"]

                    if (sentPin != _pin.value) {
                        respond(writer, 403, "text/plain", "Wrong PIN")
                    } else if (destination.isNullOrBlank()) {
                        respond(writer, 400, "text/plain", "No destination")
                    } else {
                        _incoming.value = destination
                        respond(writer, 200, "text/plain", "Sent to car: $destination")
                    }
                }
                else -> respond(writer, 200, "text/html", page())
            }
            writer.flush()
        }
    }

    private fun respond(writer: PrintWriter, code: Int, type: String, body: String) {
        writer.print("HTTP/1.1 $code OK\r\n")
        writer.print("Content-Type: $type; charset=utf-8\r\n")
        writer.print("Content-Length: ${body.toByteArray().size}\r\n")
        writer.print("Connection: close\r\n\r\n")
        writer.print(body)
    }

    private fun parseQuery(query: String): Map<String, String> =
        query.split("&").mapNotNull {
            val parts = it.split("=", limit = 2)
            if (parts.size == 2) {
                parts[0] to URLDecoder.decode(parts[1], "UTF-8")
            } else null
        }.toMap()

    /** Called by the UI once it has acted on a destination. */
    fun consume() {
        _incoming.value = null
    }

    fun stop() {
        try {
            job?.cancel()
            server?.close()
        } catch (_: Throwable) {
        }
        _address.value = null
    }

    private fun localIp(): String {
        // Prefer the Wi-Fi address; fall back to scanning interfaces (needed
        // when the box is on a phone hotspot rather than a router).
        try {
            val wifi = context.applicationContext
                .getSystemService(Context.WIFI_SERVICE) as? WifiManager
            @Suppress("DEPRECATION")
            val ip = wifi?.connectionInfo?.ipAddress ?: 0
            if (ip != 0) {
                return InetAddress.getByAddress(
                    byteArrayOf(
                        (ip and 0xff).toByte(),
                        (ip shr 8 and 0xff).toByte(),
                        (ip shr 16 and 0xff).toByte(),
                        (ip shr 24 and 0xff).toByte()
                    )
                ).hostAddress ?: "?"
            }
        } catch (_: Throwable) {
        }

        try {
            for (nif in NetworkInterface.getNetworkInterfaces()) {
                for (addr in nif.inetAddresses) {
                    if (!addr.isLoopbackAddress && addr.hostAddress?.contains('.') == true) {
                        return addr.hostAddress!!
                    }
                }
            }
        } catch (_: Throwable) {
        }
        return "?"
    }

    private fun page(): String = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Send to car</title>
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center;
    justify-content: center; background: #14161A; color: #F2EFE7;
    font-family: -apple-system, system-ui, sans-serif;
  }
  .card {
    width: 100%; max-width: 420px; padding: 28px;
    background: #1F232A; border: 1px solid #2C313A; border-radius: 18px;
  }
  h1 { margin: 0 0 4px; font-size: 20px; }
  p { margin: 0 0 20px; color: #9AA0AC; font-size: 13px; }
  label { display: block; font-size: 11px; letter-spacing: 1px;
          color: #9AA0AC; margin-bottom: 6px; text-transform: uppercase; }
  input {
    width: 100%; box-sizing: border-box; padding: 14px;
    background: #14161A; color: #F2EFE7; font-size: 16px;
    border: 1px solid #2C313A; border-radius: 10px; margin-bottom: 16px;
  }
  button {
    width: 100%; padding: 16px; font-size: 15px; font-weight: 600;
    background: #8FADE0; color: #11141A; border: 0; border-radius: 10px;
  }
  #status { margin-top: 14px; font-size: 13px; min-height: 18px; }
</style>
</head>
<body>
  <div class="card">
    <h1>Send to car</h1>
    <p>Type a destination and it appears on the car screen.</p>
    <label for="pin">PIN shown on the car</label>
    <input id="pin" inputmode="numeric" placeholder="0000">
    <label for="q">Destination</label>
    <input id="q" placeholder="Address or place">
    <button onclick="send()">SEND</button>
    <div id="status"></div>
  </div>
<script>
async function send() {
  const pin = document.getElementById('pin').value.trim();
  const q = document.getElementById('q').value.trim();
  const status = document.getElementById('status');
  if (!q) { status.textContent = 'Enter a destination.'; return; }
  status.textContent = 'Sending…';
  try {
    const r = await fetch('/go?pin=' + encodeURIComponent(pin) +
                          '&q=' + encodeURIComponent(q));
    status.textContent = await r.text();
  } catch (e) {
    status.textContent = 'Could not reach the car.';
  }
}
</script>
</body>
</html>
"""
}
