package com.marfeel.reactnative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.bridge.Arguments
import com.marfeel.compass.cdp.Cdp
import com.marfeel.compass.cdp.model.CdpData
import com.marfeel.compass.cdp.model.MeterNotFoundError
import com.marfeel.compass.cdp.model.MeterState
import com.marfeel.compass.core.model.compass.ConversionOptions
import com.marfeel.compass.core.model.compass.ConversionScope
import com.marfeel.compass.core.model.compass.UserType
import com.marfeel.compass.core.model.multimedia.Event
import com.marfeel.compass.core.model.multimedia.MultimediaMetadata
import com.marfeel.compass.core.model.multimedia.Type
import com.marfeel.compass.experiences.Experiences
import com.marfeel.compass.experiences.Recirculation
import com.marfeel.compass.experiences.model.Experience
import com.marfeel.compass.experiences.model.ExperienceFamily
import com.marfeel.compass.experiences.model.ExperienceType
import com.marfeel.compass.experiences.model.RecirculationLink
import com.marfeel.compass.tracker.CompassTracking
import com.marfeel.compass.tracker.multimedia.MultimediaTracking
import android.os.Handler
import android.os.Looper
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

@ReactModule(name = MarfeelSdkModule.NAME)
class MarfeelSdkModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "MarfeelSdk"
        private const val TAG = "MarfeelSdk"
    }

    override fun getName(): String = NAME

    private val mainHandler = Handler(Looper.getMainLooper())
    private val experienceCache = ConcurrentHashMap<String, Experience>()
    private val experiencesScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

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
    fun initialize(accountId: String, pageTechnology: Int?, enableCdp: Boolean) {
        runOnMainThread {
            val context = reactContext.applicationContext
            if (pageTechnology != null) {
                CompassTracking.initialize(context, accountId, pageTechnology, enableCdp)
            } else {
                CompassTracking.initialize(context, accountId, enableCdp = enableCdp)
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
        runOnMainThread {
            CompassTracking.getInstance().stopTracking()
            experienceCache.clear()
        }
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
    fun getSessionId(promise: Promise) {
        mainHandler.post {
            try {
                val sessionId = CompassTracking.getInstance().getSessionId()
                promise.resolve(sessionId)
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

    // region Recirculation

    @ReactMethod
    fun recirculationTrackEligible(name: String, links: ReadableArray) {
        val list = links.toLinks()
        runOnMainThread { Recirculation.getInstance().trackEligible(name, list) }
    }

    @ReactMethod
    fun recirculationTrackImpression(name: String, links: ReadableArray) {
        val list = links.toLinks()
        runOnMainThread { Recirculation.getInstance().trackImpression(name, list) }
    }

    @ReactMethod
    fun recirculationTrackClick(name: String, link: ReadableMap) {
        val l = link.toLink()
        runOnMainThread { Recirculation.getInstance().trackClick(name, l) }
    }

    // endregion

    // region Experiences

    @ReactMethod
    fun experiencesAddTargeting(key: String, value: String) {
        runOnMainThread { Experiences.getInstance().addTargeting(key, value) }
    }

    @ReactMethod
    fun experiencesFetch(
        filterByType: String?,
        filterByFamily: String?,
        resolve: Boolean,
        url: String?,
        promise: Promise
    ) {
        experiencesScope.launch {
            try {
                val typeFilter = filterByType?.let { ExperienceType.fromKey(it) }
                val familyFilter = filterByFamily?.let { ExperienceFamily.fromKey(it) }
                val list = Experiences.getInstance().fetchExperiences(
                    filterByType = typeFilter,
                    filterByFamily = familyFilter,
                    resolve = resolve,
                    url = url
                )
                list.forEach { experienceCache[it.id] = it }
                promise.resolve(serializeExperiences(list))
            } catch (e: Exception) {
                promise.reject("EXPERIENCES_FETCH", e.message, e)
            }
        }
    }

    @ReactMethod
    fun experiencesResolveContent(experienceId: String, promise: Promise) {
        val exp = experienceCache[experienceId]
        if (exp == null) {
            promise.resolve(null)
            return
        }
        experiencesScope.launch {
            try {
                promise.resolve(exp.resolve())
            } catch (e: Exception) {
                promise.reject("EXPERIENCES_RESOLVE", e.message, e)
            }
        }
    }

    @ReactMethod
    fun experiencesTrackEligible(experienceId: String, links: ReadableArray) {
        val exp = experienceCache[experienceId] ?: return
        val list = links.toLinks()
        runOnMainThread { Experiences.getInstance().trackEligible(exp, list) }
    }

    @ReactMethod
    fun experiencesTrackImpression(experienceId: String, links: ReadableArray) {
        val exp = experienceCache[experienceId] ?: return
        val list = links.toLinks()
        runOnMainThread { Experiences.getInstance().trackImpression(exp, list) }
    }

    @ReactMethod
    fun experiencesTrackClick(experienceId: String, link: ReadableMap) {
        val exp = experienceCache[experienceId] ?: return
        val l = link.toLink()
        runOnMainThread { Experiences.getInstance().trackClick(exp, l) }
    }

    @ReactMethod
    fun experiencesTrackClose(experienceId: String) {
        val exp = experienceCache[experienceId] ?: return
        runOnMainThread { Experiences.getInstance().trackClose(exp) }
    }

    @ReactMethod
    fun experiencesClearFrequencyCaps() {
        runOnMainThread { Experiences.getInstance().clearFrequencyCaps() }
    }

    @ReactMethod
    fun experiencesGetFrequencyCapCounts(experienceId: String, promise: Promise) {
        try {
            val counts = Experiences.getInstance().getFrequencyCapCounts(experienceId)
            val map = Arguments.createMap()
            counts.forEach { (k, v) -> map.putDouble(k, v.toDouble()) }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("EXPERIENCES_FREQ_COUNTS", e.message, e)
        }
    }

    @ReactMethod
    fun experiencesGetFrequencyCapConfig(promise: Promise) {
        try {
            val config = Experiences.getInstance().getFrequencyCapConfig()
            val map = Arguments.createMap()
            config.forEach { (k, v) ->
                val arr = Arguments.createArray()
                v.forEach { arr.pushString(it) }
                map.putArray(k, arr)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("EXPERIENCES_FREQ_CONFIG", e.message, e)
        }
    }

    @ReactMethod
    fun experiencesClearReadEditorials() {
        runOnMainThread { Experiences.getInstance().clearReadEditorials() }
    }

    @ReactMethod
    fun experiencesGetReadEditorials(promise: Promise) {
        try {
            val ids = Experiences.getInstance().getReadEditorials()
            val arr = Arguments.createArray()
            ids.forEach { arr.pushString(it) }
            promise.resolve(arr)
        } catch (e: Exception) {
            promise.reject("EXPERIENCES_READ_EDITORIALS", e.message, e)
        }
    }

    @ReactMethod
    fun experiencesGetExperimentAssignments(promise: Promise) {
        try {
            val assignments = Experiences.getInstance().getExperimentAssignments()
            val map = Arguments.createMap()
            assignments.forEach { (k, v) -> map.putString(k, v) }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("EXPERIENCES_EXPERIMENTS", e.message, e)
        }
    }

    @ReactMethod
    fun experiencesSetExperimentAssignment(groupId: String, variantId: String) {
        runOnMainThread {
            Experiences.getInstance().setExperimentAssignment(groupId, variantId)
        }
    }

    @ReactMethod
    fun experiencesClearExperimentAssignments() {
        runOnMainThread { Experiences.getInstance().clearExperimentAssignments() }
    }

    // endregion

    // region CDP

    @ReactMethod
    fun cdpLinkIdentity(type: String, value: String, isDeterministic: Boolean) {
        Cdp.getInstance().cdpDoIdentityLink(type, value, isDeterministic)
    }

    @ReactMethod
    fun cdpGetData(promise: Promise) {
        try {
            promise.resolve(serializeCdpData(Cdp.getInstance().getCdpData()))
        } catch (e: Exception) {
            promise.reject("CDP_GET_DATA", e.message, e)
        }
    }

    @ReactMethod
    fun cdpGetMasterId(promise: Promise) {
        try {
            promise.resolve(Cdp.getInstance().getCdpMasterId())
        } catch (e: Exception) {
            promise.reject("CDP_GET_MASTER_ID", e.message, e)
        }
    }

    @ReactMethod
    fun cdpAddSegment(segment: String) {
        Cdp.getInstance().addCdpSegment(segment)
    }

    @ReactMethod
    fun cdpRemoveSegment(segment: String) {
        Cdp.getInstance().removeCdpSegment(segment)
    }

    @ReactMethod
    fun cdpSetSegments(segments: ReadableArray) {
        val list = mutableListOf<String>()
        for (i in 0 until segments.size()) {
            segments.getString(i)?.let { list.add(it) }
        }
        Cdp.getInstance().setCdpSegments(list)
    }

    @ReactMethod
    fun cdpClearSegments() {
        Cdp.getInstance().clearCdpSegments()
    }

    @ReactMethod
    fun cdpGetSegments(promise: Promise) {
        try {
            val arr = Arguments.createArray()
            Cdp.getInstance().getCdpSegments().forEach { arr.pushString(it) }
            promise.resolve(arr)
        } catch (e: Exception) {
            promise.reject("CDP_GET_SEGMENTS", e.message, e)
        }
    }

    @ReactMethod
    fun cdpGetMeterSnapshot(promise: Promise) {
        experiencesScope.launch {
            try {
                promise.resolve(serializeMeters(Cdp.getInstance().getMeterSnapshot()))
            } catch (e: Exception) {
                promise.reject("CDP_METER_SNAPSHOT", e.message, e)
            }
        }
    }

    @ReactMethod
    fun cdpGetMeter(name: String, promise: Promise) {
        try {
            promise.resolve(serializeMeter(Cdp.getInstance().getMeter(name)))
        } catch (e: Exception) {
            promise.reject("CDP_GET_METER", e.message, e)
        }
    }

    @ReactMethod
    fun cdpListMeters(promise: Promise) {
        try {
            promise.resolve(serializeMeters(Cdp.getInstance().listMeters()))
        } catch (e: Exception) {
            promise.reject("CDP_LIST_METERS", e.message, e)
        }
    }

    @ReactMethod
    fun cdpIncrementMeter(name: String, promise: Promise) {
        experiencesScope.launch {
            try {
                promise.resolve(serializeMeter(Cdp.getInstance().incrementMeter(name)))
            } catch (e: MeterNotFoundError) {
                promise.reject("METER_NOT_FOUND", e.message, e)
            } catch (e: Exception) {
                promise.reject("CDP_INCREMENT_METER", e.message, e)
            }
        }
    }

    // endregion

    // region Bridge helpers

    private fun ReadableArray.toLinks(): List<RecirculationLink> {
        val out = mutableListOf<RecirculationLink>()
        for (i in 0 until size()) {
            val item = if (!isNull(i)) getMap(i) else null
            item?.let { out.add(it.toLink()) }
        }
        return out
    }

    private fun ReadableMap.toLink(): RecirculationLink {
        val url = if (hasKey("url") && !isNull("url")) getString("url") ?: "" else ""
        val position = if (hasKey("position") && !isNull("position")) getInt("position") else 0
        return RecirculationLink(url = url, position = position)
    }

    private val isoDateFormat by lazy {
        java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).apply {
            timeZone = java.util.TimeZone.getTimeZone("UTC")
        }
    }

    private fun serializeCdpData(data: CdpData): String {
        val o = JSONObject()
        o.put("masterId", data.masterId ?: JSONObject.NULL)
        o.put(
            "rfv",
            data.rfv?.let {
                JSONObject()
                    .put("rfv", it.rfv)
                    .put("r", it.r)
                    .put("f", it.f)
                    .put("v", it.v)
            } ?: JSONObject.NULL
        )
        o.put("cohorts", JSONArray(data.cohorts))
        return o.toString()
    }

    private fun serializeMeters(meters: List<MeterState>): String {
        val arr = JSONArray()
        meters.forEach { arr.put(meterToJson(it)) }
        return arr.toString()
    }

    private fun serializeMeter(meter: MeterState?): String? =
        meter?.let { meterToJson(it).toString() }

    private fun meterToJson(meter: MeterState): JSONObject {
        val o = JSONObject()
        o.put("name", meter.name)
        o.put("count", meter.count)
        meter.threshold?.let { o.put("threshold", it) }
        meter.reached?.let { o.put("reached", it) }
        meter.remaining?.let { o.put("remaining", it) }
        meter.startedAt?.let { o.put("startedAt", isoDateFormat.format(it)) }
        meter.expiresAt?.let { o.put("expiresAt", isoDateFormat.format(it)) }
        o.put(
            "window",
            JSONObject()
                .put("duration", meter.window.duration)
                .put("period", meter.window.period)
                .put("tz", meter.window.tz)
        )
        return o
    }

    private fun serializeExperiences(experiences: List<Experience>): String {
        val arr = JSONArray()
        experiences.forEach { e ->
            val o = JSONObject()
            o.put("id", e.id)
            o.put("name", e.name)
            o.put("type", e.type.key)
            o.put("family", e.family?.key ?: JSONObject.NULL)
            o.put("placement", e.placement ?: JSONObject.NULL)
            o.put("contentUrl", e.contentUrl ?: JSONObject.NULL)
            o.put("contentType", e.contentType.key)
            o.put("features", e.features?.let { JSONObject(it) } ?: JSONObject.NULL)
            o.put("strategy", e.strategy ?: JSONObject.NULL)
            o.put(
                "selectors",
                e.selectors?.let { sels ->
                    JSONArray().apply {
                        sels.forEach {
                            put(
                                JSONObject()
                                    .put("selector", it.selector)
                                    .put("strategy", it.strategy)
                            )
                        }
                    }
                } ?: JSONObject.NULL
            )
            o.put(
                "filters",
                e.filters?.let { fs ->
                    JSONArray().apply {
                        fs.forEach {
                            put(
                                JSONObject()
                                    .put("key", it.key)
                                    .put("operator", it.operator)
                                    .put("values", JSONArray(it.values))
                            )
                        }
                    }
                } ?: JSONObject.NULL
            )
            o.put("rawJson", JSONObject(e.rawJson))
            o.put("resolvedContent", e.resolvedContent ?: JSONObject.NULL)
            arr.put(o)
        }
        return arr.toString()
    }

    // endregion
}
