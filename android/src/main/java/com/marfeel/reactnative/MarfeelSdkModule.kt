package com.marfeel.reactnative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.marfeel.compass.core.model.compass.ConversionOptions
import com.marfeel.compass.core.model.compass.ConversionScope
import com.marfeel.compass.core.model.compass.UserType
import com.marfeel.compass.core.model.multimedia.Event
import com.marfeel.compass.core.model.multimedia.MultimediaMetadata
import com.marfeel.compass.core.model.multimedia.Type
import com.marfeel.compass.tracker.CompassTracking
import com.marfeel.compass.tracker.multimedia.MultimediaTracking
import android.os.Handler
import android.os.Looper
import android.util.Log
import org.json.JSONObject

@ReactModule(name = MarfeelSdkModule.NAME)
class MarfeelSdkModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "MarfeelSdk"
        private const val TAG = "MarfeelSdk"
    }

    override fun getName(): String = NAME

    private val mainHandler = Handler(Looper.getMainLooper())

    private inline fun runOnMainThread(crossinline block: () -> Unit) {
        mainHandler.post {
            try {
                block()
            } catch (e: Exception) {
                Log.e(TAG, "Error: ${e.message}", e)
            }
        }
    }

    @ReactMethod
    fun initialize(accountId: String, pageTechnology: Int?) {
        runOnMainThread {
            val context = reactContext.applicationContext
            if (pageTechnology != null) {
                CompassTracking.initialize(context, accountId, pageTechnology)
            } else {
                CompassTracking.initialize(context, accountId)
            }
        }
    }

    @ReactMethod
    fun trackNewPage(url: String, rs: String?) {
        runOnMainThread {
            CompassTracking.getInstance().trackNewPage(url, rs)
        }
    }

    @ReactMethod
    fun trackScreen(screen: String, rs: String?) {
        runOnMainThread {
            CompassTracking.getInstance().trackScreen(screen, rs)
        }
    }

    @ReactMethod
    fun updateScrollPercentage(percentage: Int) {
        runOnMainThread {
            CompassTracking.getInstance().updateScrollPercentage(percentage)
        }
    }

    @ReactMethod
    fun stopTracking() {
        runOnMainThread { CompassTracking.getInstance().stopTracking() }
    }

    @ReactMethod
    fun setLandingPage(landingPage: String) {
        runOnMainThread { CompassTracking.getInstance().setLandingPage(landingPage) }
    }

    @ReactMethod
    fun setSiteUserId(userId: String) {
        runOnMainThread { CompassTracking.getInstance().setSiteUserId(userId) }
    }

    @ReactMethod
    fun getUserId(promise: Promise) {
        mainHandler.post {
            try {
                val userId = CompassTracking.getInstance().getUserId()
                promise.resolve(userId)
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun setUserType(userType: Int) {
        runOnMainThread {
            val type = when (userType) {
                1 -> UserType.Anonymous
                2 -> UserType.Logged
                3 -> UserType.Paid
                else -> UserType.Custom(userType)
            }
            CompassTracking.getInstance().setUserType(type)
        }
    }

    @ReactMethod
    fun getRFV(promise: Promise) {
        mainHandler.post {
            try {
                CompassTracking.getInstance().getRFV { rfv ->
                    promise.resolve(rfv)
                }
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun setPageVar(name: String, value: String) {
        runOnMainThread { CompassTracking.getInstance().setPageVar(name, value) }
    }

    @ReactMethod
    fun setPageMetric(name: String, value: Int) {
        runOnMainThread { CompassTracking.getInstance().setPageMetric(name, value) }
    }

    @ReactMethod
    fun setSessionVar(name: String, value: String) {
        runOnMainThread { CompassTracking.getInstance().setSessionVar(name, value) }
    }

    @ReactMethod
    fun setUserVar(name: String, value: String) {
        runOnMainThread { CompassTracking.getInstance().setUserVar(name, value) }
    }

    @ReactMethod
    fun addUserSegment(segment: String) {
        runOnMainThread { CompassTracking.getInstance().addUserSegment(segment) }
    }

    @ReactMethod
    fun setUserSegments(segments: ReadableArray) {
        runOnMainThread {
            val list = mutableListOf<String>()
            for (i in 0 until segments.size()) {
                segments.getString(i)?.let { list.add(it) }
            }
            CompassTracking.getInstance().setUserSegments(list)
        }
    }

    @ReactMethod
    fun removeUserSegment(segment: String) {
        runOnMainThread { CompassTracking.getInstance().removeUserSegment(segment) }
    }

    @ReactMethod
    fun clearUserSegments() {
        runOnMainThread { CompassTracking.getInstance().clearUserSegments() }
    }

    @ReactMethod
    fun trackConversion(
        conversion: String,
        initiator: String?,
        id: String?,
        value: String?,
        meta: ReadableMap?,
        scope: String?
    ) {
        runOnMainThread {
            val metaMap = meta?.let {
                val map = mutableMapOf<String, String>()
                val iterator = it.keySetIterator()
                while (iterator.hasNextKey()) {
                    val key = iterator.nextKey()
                    it.getString(key)?.let { v -> map[key] = v }
                }
                map
            }

            val conversionScope = when (scope) {
                "user" -> ConversionScope.User
                "session" -> ConversionScope.Session
                "page" -> ConversionScope.Page
                else -> null
            }

            if (initiator == null && id == null && value == null && metaMap == null && conversionScope == null) {
                CompassTracking.getInstance().trackConversion(conversion)
            } else {
                CompassTracking.getInstance().trackConversion(
                    conversion,
                    ConversionOptions(
                        initiator = initiator,
                        id = id,
                        value = value,
                        meta = metaMap,
                        scope = conversionScope
                    )
                )
            }
        }
    }

    @ReactMethod
    fun setConsent(hasConsent: Boolean) {
        runOnMainThread { CompassTracking.getInstance().setUserConsent(hasConsent) }
    }

    @ReactMethod
    fun initializeMultimediaItem(
        id: String,
        provider: String,
        providerId: String,
        type: String,
        metadataJson: String
    ) {
        runOnMainThread {
            val mediaType = if (type == "audio") Type.AUDIO else Type.VIDEO
            val json = JSONObject(metadataJson)
            val metadata = MultimediaMetadata(
                isLive = if (json.has("isLive")) json.getBoolean("isLive") else false,
                title = if (json.has("title")) json.getString("title") else null,
                description = if (json.has("description")) json.getString("description") else null,
                url = if (json.has("url")) json.getString("url") else null,
                thumbnail = if (json.has("thumbnail")) json.getString("thumbnail") else null,
                authors = if (json.has("authors")) json.getString("authors") else null,
                publishTime = if (json.has("publishTime")) json.getLong("publishTime") else null,
                duration = if (json.has("duration")) json.getInt("duration") else null
            )
            MultimediaTracking.getInstance().initializeItem(id, provider, providerId, mediaType, metadata)
        }
    }

    @ReactMethod
    fun registerMultimediaEvent(id: String, event: String, eventTime: Int) {
        val mediaEvent = when (event) {
            "play" -> Event.PLAY
            "pause" -> Event.PAUSE
            "end" -> Event.END
            "updateCurrentTime" -> Event.UPDATE_CURRENT_TIME
            "adPlay" -> Event.AD_PLAY
            "mute" -> Event.MUTE
            "unmute" -> Event.UNMUTE
            "fullscreen" -> Event.FULL_SCREEN
            "backscreen" -> Event.BACK_SCREEN
            "enterViewport" -> Event.ENTER_VIEWPORT
            "leaveViewport" -> Event.LEAVE_VIEWPORT
            else -> return
        }
        runOnMainThread { MultimediaTracking.getInstance().registerEvent(id, mediaEvent, eventTime) }
    }
}
