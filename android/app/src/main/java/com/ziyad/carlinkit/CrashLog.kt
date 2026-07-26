package com.ziyad.carlinkit

import android.content.Context
import java.io.PrintWriter
import java.io.StringWriter

/**
 * Persists the most recent crash / init failure so it can be displayed on screen.
 * The car head unit has no practical access to logcat, so this is the diagnostic channel.
 */
object CrashLog {

    private const val PREFS = "carlinkkit_crash"
    private const val KEY_LAST = "last_crash"

    fun record(context: Context, where: String, t: Throwable) {
        try {
            val sw = StringWriter()
            t.printStackTrace(PrintWriter(sw))
            val text = buildString {
                append("WHERE: ").append(where).append('\n')
                append("TYPE : ").append(t.javaClass.name).append('\n')
                append("MSG  : ").append(t.message ?: "(none)").append('\n')
                append("---\n")
                append(sw.toString().take(4000))
            }
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_LAST, text)
                .apply()
        } catch (_: Throwable) {
            // Diagnostics must never themselves crash the app.
        }
    }

    fun read(context: Context): String? =
        try {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getString(KEY_LAST, null)
        } catch (_: Throwable) {
            null
        }

    fun clear(context: Context) {
        try {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().remove(KEY_LAST).apply()
        } catch (_: Throwable) {
        }
    }

    /**
     * Installs a global handler so any uncaught exception is stored before the process dies.
     * On next launch the app shows it instead of failing silently.
     */
    fun install(context: Context) {
        val appContext = context.applicationContext
        val previous = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            record(appContext, "uncaught on ${thread.name}", throwable)
            previous?.uncaughtException(thread, throwable)
        }
    }
}
