import Foundation
import MarfeelSDK_iOS
import React

@objc(MarfeelSdk)
class MarfeelSdk: NSObject {

    private var experienceCache: [String: Experience] = [:]
    private let cacheQueue = DispatchQueue(
        label: "com.marfeel.rn.expcache",
        attributes: .concurrent
    )

    @objc func initialize(_ accountId: String, pageTechnology: NSNumber?) {
        let accountIdInt = Int(accountId) ?? 0
        if let tech = pageTechnology?.intValue, tech > 0 {
            CompassTracker.initialize(accountId: accountIdInt, pageTechnology: tech)
        } else {
            CompassTracker.initialize(accountId: accountIdInt)
        }
    }

    @objc func trackNewPage(_ url: String, rs: String?) {
        guard let pageUrl = URL(string: url) else { return }
        CompassTracker.shared.trackNewPage(url: pageUrl, rs: rs)
    }

    @objc func trackScreen(_ screen: String, rs: String?) {
        CompassTracker.shared.trackScreen(screen, rs: rs)
    }

    @objc func updateScrollPercentage(_ percentage: Float) {
        CompassTracker.shared.updateScrollPercentage(percentage)
    }

    @objc func stopTracking() {
        CompassTracker.shared.stopTracking()
        cacheQueue.async(flags: .barrier) { [weak self] in
            self?.experienceCache.removeAll()
        }
    }

    @objc func setLandingPage(_ landingPage: String) {
        CompassTracker.shared.setLandingPage(landingPage)
    }

    @objc func setSiteUserId(_ userId: String) {
        CompassTracker.shared.setSiteUserId(userId)
    }

    @objc func getUserId(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let userId = CompassTracker.shared.getUserId()
        resolve(userId)
    }

    @objc func setUserType(_ userType: Int) {
        let type: UserType
        switch userType {
        case 1: type = .anonymous
        case 2: type = .logged
        case 3: type = .paid
        default: type = .custom(userType)
        }
        CompassTracker.shared.setUserType(type)
    }

    @objc func getRFV(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        CompassTracker.shared.getRFV { rfv in
            if let rfv = rfv {
                let json: [String: Any] = [
                    "rfv": rfv.rfv,
                    "r": rfv.r,
                    "f": rfv.f,
                    "v": rfv.v
                ]
                if let data = try? JSONSerialization.data(withJSONObject: json),
                   let jsonString = String(data: data, encoding: .utf8) {
                    resolve(jsonString)
                } else {
                    resolve(nil)
                }
            } else {
                resolve(nil)
            }
        }
    }

    @objc func setPageVar(_ name: String, value: String) {
        CompassTracker.shared.setPageVar(name: name, value: value)
    }

    @objc func setPageMetric(_ name: String, value: Int) {
        CompassTracker.shared.setPageMetric(name: name, value: value)
    }

    @objc func setSessionVar(_ name: String, value: String) {
        CompassTracker.shared.setSessionVar(name: name, value: value)
    }

    @objc func setUserVar(_ name: String, value: String) {
        CompassTracker.shared.setUserVar(name: name, value: value)
    }

    @objc func addUserSegment(_ segment: String) {
        CompassTracker.shared.addUserSegment(segment)
    }

    @objc func setUserSegments(_ segments: [String]) {
        CompassTracker.shared.setUserSegments(segments)
    }

    @objc func removeUserSegment(_ segment: String) {
        CompassTracker.shared.removeUserSegment(segment)
    }

    @objc func clearUserSegments() {
        CompassTracker.shared.clearUserSegments()
    }

    @objc func trackConversion(_ conversion: String, initiator: String?, id: String?, value: String?, meta: [String: String]?, scope: String?) {
        let conversionScope: ConversionScope?
        switch scope {
        case "user": conversionScope = .user
        case "session": conversionScope = .session
        case "page": conversionScope = .page
        default: conversionScope = nil
        }

        if initiator == nil && id == nil && value == nil && meta == nil && conversionScope == nil {
            CompassTracker.shared.trackConversion(conversion: conversion)
        } else {
            let options = ConversionOptions(
                initiator: initiator,
                id: id,
                value: value,
                meta: meta,
                scope: conversionScope
            )
            CompassTracker.shared.trackConversion(conversion: conversion, options: options)
        }
    }

    @objc func setConsent(_ hasConsent: Bool) {
        CompassTracker.shared.setConsent(hasConsent)
    }

    @objc func initializeMultimediaItem(_ id: String, provider: String, providerId: String, type: String, metadata: String) {
        let mediaType: MarfeelSDK_iOS.`Type` = type == "audio" ? .AUDIO : .VIDEO

        var multimediaMetadata = MultimediaMetadata()
        if let data = metadata.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            multimediaMetadata = MultimediaMetadata(
                isLive: json["isLive"] as? Bool ?? false,
                title: json["title"] as? String,
                description: json["description"] as? String,
                url: (json["url"] as? String).flatMap { URL(string: $0) },
                thumbnail: (json["thumbnail"] as? String).flatMap { URL(string: $0) },
                authors: json["authors"] as? String,
                publishTime: (json["publishTime"] as? Int64).flatMap { Date(timeIntervalSince1970: TimeInterval($0) / 1000) },
                duration: json["duration"] as? Int
            )
        }

        CompassTrackerMultimedia.shared.initializeItem(
            id: id,
            provider: provider,
            providerId: providerId,
            type: mediaType,
            metadata: multimediaMetadata
        )
    }

    @objc func registerMultimediaEvent(_ id: String, event: String, eventTime: Int) {
        let mediaEvent: Event
        switch event {
        case "play": mediaEvent = .PLAY
        case "pause": mediaEvent = .PAUSE
        case "end": mediaEvent = .END
        case "updateCurrentTime": mediaEvent = .UPDATE_CURRENT_TIME
        case "adPlay": mediaEvent = .AD_PLAY
        case "mute": mediaEvent = .MUTE
        case "unmute": mediaEvent = .UNMUTE
        case "fullscreen": mediaEvent = .FULL_SCREEN
        case "backscreen": mediaEvent = .BACK_SCREEN
        case "enterViewport": mediaEvent = .ENTER_VIEWPORT
        case "leaveViewport": mediaEvent = .LEAVE_VIEWPORT
        default: return
        }

        CompassTrackerMultimedia.shared.registerEvent(id: id, event: mediaEvent, eventTime: eventTime)
    }

    // MARK: - Recirculation

    @objc func recirculationTrackEligible(_ name: String, links: NSArray) {
        Recirculation.shared.trackEligible(name: name, links: Self.toLinks(links))
    }

    @objc func recirculationTrackImpression(_ name: String, links: NSArray) {
        Recirculation.shared.trackImpression(name: name, links: Self.toLinks(links))
    }

    @objc func recirculationTrackClick(_ name: String, link: NSDictionary) {
        Recirculation.shared.trackClick(name: name, link: Self.toLink(link))
    }

    // MARK: - Experiences

    @objc func experiencesAddTargeting(_ key: String, value: String) {
        Experiences.shared.addTargeting(key: key, value: value)
    }

    @objc func experiencesFetch(
        _ filterByType: String?,
        filterByFamily: String?,
        resolve: Bool,
        url: String?,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        let typeFilter = filterByType.flatMap { ExperienceType(rawValue: $0) }
        let familyFilter: ExperienceFamily? = filterByFamily.flatMap { Self.familyFromServerKey[$0] }

        Experiences.shared.fetchExperiences(
            filterByType: typeFilter,
            filterByFamily: familyFilter,
            resolve: resolve,
            url: url
        ) { [weak self] experiences in
            self?.cache(experiences)
            resolver(Self.serialize(experiences))
        }
    }

    @objc func experiencesResolveContent(
        _ experienceId: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        guard let exp = cached(experienceId) else {
            resolver(NSNull())
            return
        }
        exp.resolve { content in
            resolver(content ?? NSNull())
        }
    }

    @objc func experiencesTrackEligible(_ experienceId: String, links: NSArray) {
        guard let exp = cached(experienceId) else { return }
        Experiences.shared.trackEligible(experience: exp, links: Self.toLinks(links))
    }

    @objc func experiencesTrackImpression(_ experienceId: String, links: NSArray) {
        guard let exp = cached(experienceId) else { return }
        Experiences.shared.trackImpression(experience: exp, links: Self.toLinks(links))
    }

    @objc func experiencesTrackClick(_ experienceId: String, link: NSDictionary) {
        guard let exp = cached(experienceId) else { return }
        Experiences.shared.trackClick(experience: exp, link: Self.toLink(link))
    }

    @objc func experiencesTrackClose(_ experienceId: String) {
        guard let exp = cached(experienceId) else { return }
        Experiences.shared.trackClose(experience: exp)
    }

    @objc func experiencesClearFrequencyCaps() {
        Experiences.shared.clearFrequencyCaps()
    }

    @objc func experiencesGetFrequencyCapCounts(
        _ experienceId: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        resolver(Experiences.shared.getFrequencyCapCounts(experienceId: experienceId))
    }

    @objc func experiencesGetFrequencyCapConfig(
        _ resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        resolver(Experiences.shared.getFrequencyCapConfig())
    }

    @objc func experiencesClearReadEditorials() {
        Experiences.shared.clearReadEditorials()
    }

    @objc func experiencesGetReadEditorials(
        _ resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        resolver(Experiences.shared.getReadEditorials())
    }

    @objc func experiencesGetExperimentAssignments(
        _ resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        resolver(Experiences.shared.getExperimentAssignments())
    }

    @objc func experiencesSetExperimentAssignment(_ groupId: String, variantId: String) {
        Experiences.shared.setExperimentAssignment(groupId: groupId, variantId: variantId)
    }

    @objc func experiencesClearExperimentAssignments() {
        Experiences.shared.clearExperimentAssignments()
    }

    // MARK: - Cache

    private func cache(_ experiences: [Experience]) {
        cacheQueue.async(flags: .barrier) { [weak self] in
            for e in experiences { self?.experienceCache[e.id] = e }
        }
    }

    private func cached(_ id: String) -> Experience? {
        cacheQueue.sync { experienceCache[id] }
    }

    // MARK: - Bridge helpers

    private static func toLinks(_ array: NSArray) -> [RecirculationLink] {
        return array.compactMap { item in
            guard let dict = item as? NSDictionary else { return nil }
            return toLink(dict)
        }
    }

    private static func toLink(_ dict: NSDictionary) -> RecirculationLink {
        let url = dict["url"] as? String ?? ""
        let position = (dict["position"] as? NSNumber)?.intValue ?? 0
        return RecirculationLink(url: url, position: position)
    }

    private static func serialize(_ experiences: [Experience]) -> String {
        let array: [[String: Any]] = experiences.map { e in
            let familyValue: Any = e.family.map { familyKey($0) } ?? NSNull()
            let placementValue: Any = e.placement ?? NSNull()
            let contentUrlValue: Any = e.contentUrl ?? NSNull()
            let strategyValue: Any = e.strategy ?? NSNull()
            let resolvedContentValue: Any = e.resolvedContent ?? NSNull()

            let featuresValue: Any
            if let f = e.features, JSONSerialization.isValidJSONObject(f) {
                featuresValue = f
            } else {
                featuresValue = NSNull()
            }

            let rawJsonValue: Any
            if JSONSerialization.isValidJSONObject(e.rawJson) {
                rawJsonValue = e.rawJson
            } else {
                rawJsonValue = [String: Any]()
            }

            let selectorsValue: Any = e.selectors.map { sels in
                sels.map { ["selector": $0.selector, "strategy": $0.strategy] }
            } ?? NSNull()

            let filtersValue: Any = e.filters.map { fs in
                fs.map { ["key": $0.key, "operator": $0.operator.key, "values": $0.values] as [String: Any] }
            } ?? NSNull()

            return [
                "id": e.id,
                "name": e.name,
                "type": e.type.rawValue,
                "family": familyValue,
                "placement": placementValue,
                "contentUrl": contentUrlValue,
                "contentType": contentTypeKey(e.contentType),
                "features": featuresValue,
                "strategy": strategyValue,
                "selectors": selectorsValue,
                "filters": filtersValue,
                "rawJson": rawJsonValue,
                "resolvedContent": resolvedContentValue,
            ]
        }
        guard let data = try? JSONSerialization.data(withJSONObject: array, options: []),
              let s = String(data: data, encoding: .utf8) else {
            return "[]"
        }
        return s
    }

    private static let familyToServerKey: [ExperienceFamily: String] = [
        .twitter: "twitterexperience",
        .facebook: "facebookexperience",
        .youtube: "youtubeexperience",
        .recommender: "recommenderexperience",
        .telegram: "telegramexperience",
        .gathering: "gatheringexperience",
        .affiliate: "affiliateexperience",
        .podcast: "podcastexperience",
        .experimentation: "experimentsexperience",
        .widget: "widgetexperience",
        .marfeelPass: "passexperience",
        .script: "scriptexperience",
        .paywall: "paywallexperience",
        .marfeelSocial: "marfeelsocial",
        .unknown: "unknown",
    ]

    private static func familyKey(_ family: ExperienceFamily) -> String {
        return familyToServerKey[family] ?? "unknown"
    }

    private static let familyFromServerKey: [String: ExperienceFamily] = Dictionary(
        uniqueKeysWithValues: familyToServerKey.map { ($0.value, $0.key) }
    )

    private static let contentTypeToServerKey: [ExperienceContentType: String] = [
        .textHTML: "TextHTML",
        .json: "Json",
        .amp: "AMP",
        .widgetProvider: "WidgetProvider",
        .adServer: "AdServer",
        .container: "Container",
        .unknown: "Unknown",
    ]

    private static func contentTypeKey(_ ct: ExperienceContentType) -> String {
        return contentTypeToServerKey[ct] ?? "Unknown"
    }
}
