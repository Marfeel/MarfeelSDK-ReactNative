package com.marfeel.reactnative

import android.view.View
import android.widget.ScrollView
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerModule
import com.marfeel.compass.tracker.CompassTracking
import com.marfeel.compass.tracker.ConversionOptions
import com.marfeel.compass.tracker.ConversionScope
import com.marfeel.compass.tracker.UserType
import com.marfeel.compass.tracker.multimedia.MultimediaTracking
import com.marfeel.compass.tracker.multimedia.Event
import com.marfeel.compass.tracker.multimedia.MultimediaMetadata
import com.marfeel.compass.tracker.multimedia.Type
import org.json.JSONObject

@ReactModule(name = MarfeelSdkModule.NAME)
class MarfeelSdkModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "MarfeelSdk"
    }

    override fun getName(): String = NAME

    private fun findScrollView(tag: Int): ScrollView? {
        return try {
            val uiManager = reactContext.getNativeModule(UIManagerModule::class.java)
            val view = uiManager?.resolveView(tag)
            findScrollViewInHierarchy(view)
        } catch (e: Exception) {
            null
        }
    }

    private fun findScrollViewInHierarchy(view: View?): ScrollView? {
        if (view == null) return null
        if (view is ScrollView) return view
        if (view is android.view.ViewGroup) {
            for (i in 0 until view.childCount) {
                val found = findScrollViewInHierarchy(view.getChildAt(i))
                if (found != null) return found
            }
        }
        return null
    }

    @ReactMethod
    fun initialize(accountId: String, pageTechnology: Int?) {
        val context = reactContext.applicationContext
        if (pageTechnology != null) {
            CompassTracking.initialize(context, accountId, pageTechnology)
        } else {
            CompassTracking.initialize(context, accountId)
        }
    }

    @ReactMethod
    fun trackNewPage(url: String, scrollViewTag: Int?, rs: String?) {
        val scrollView = scrollViewTag?.let { findScrollView(it) }
        if (scrollView != null) {
            CompassTracking.getInstance().trackNewPage(url, scrollView, rs)
        } else {
            CompassTracking.getInstance().trackNewPage(url, rs)
        }
    }

    @ReactMethod
    fun trackScreen(screen: String, scrollViewTag: Int?, rs: String?) {
        val scrollView = scrollViewTag?.let { findScrollView(it) }
        if (scrollView != null) {
            CompassTracking.getInstance().trackScreen(screen, scrollView, rs)
        } else {
            CompassTracking.getInstance().trackScreen(screen, rs)
        }
    }

    @ReactMethod
    fun stopTracking() {
        CompassTracking.getInstance().stopTracking()
    }

    @ReactMethod
    fun setLandingPage(landingPage: String) {
        CompassTracking.getInstance().setLandingPage(landingPage)
    }

    @ReactMethod
    fun setSiteUserId(userId: String) {
        CompassTracking.getInstance().setSiteUserId(userId)
    }

    @ReactMethod
    fun getUserId(promise: Promise) {
        try {
            val userId = CompassTracking.getInstance().getUserId()
            promise.resolve(userId)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun setUserType(userType: Int) {
        val type = when (userType) {
            1 -> UserType.Anonymous
            2 -> UserType.Logged
            3 -> UserType.Paid
            else -> UserType.Custom(userType)
        }
        CompassTracking.getInstance().setUserType(type)
    }

    @ReactMethod
    fun getRFV(promise: Promise) {
        CompassTracking.getInstance().getRFV { rfv ->
            promise.resolve(rfv)
        }
    }

    @ReactMethod
    fun setPageVar(name: String, value: String) {
        CompassTracking.getInstance().setPageVar(name, value)
    }

    @ReactMethod
    fun setPageMetric(name: String, value: Int) {
        CompassTracking.getInstance().setPageMetric(name, value)
    }

    @ReactMethod
    fun setSessionVar(name: String, value: String) {
        CompassTracking.getInstance().setSessionVar(name, value)
    }

    @ReactMethod
    fun setUserVar(name: String, value: String) {
        CompassTracking.getInstance().setUserVar(name, value)
    }

    @ReactMethod
    fun addUserSegment(segment: String) {
        CompassTracking.getInstance().addUserSegment(segment)
    }

    @ReactMethod
    fun setUserSegments(segments: ReadableArray) {
        val list = mutableListOf<String>()
        for (i in 0 until segments.size()) {
            segments.getString(i)?.let { list.add(it) }
        }
        CompassTracking.getInstance().setUserSegments(list)
    }

    @ReactMethod
    fun removeUserSegment(segment: String) {
        CompassTracking.getInstance().removeUserSegment(segment)
    }

    @ReactMethod
    fun clearUserSegments() {
        CompassTracking.getInstance().clearUserSegments()
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

    @ReactMethod
    fun setConsent(hasConsent: Boolean) {
        CompassTracking.getInstance().setUserConsent(hasConsent)
    }

    @ReactMethod
    fun initializeMultimediaItem(
        id: String,
        provider: String,
        providerId: String,
        type: String,
        metadataJson: String
    ) {
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
        MultimediaTracking.getInstance().registerEvent(id, mediaEvent, eventTime)
    }
}
