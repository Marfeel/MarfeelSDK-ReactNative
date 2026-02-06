import Foundation
import CompassSDK
import React

@objc(MarfeelSdk)
class MarfeelSdk: NSObject {

    private func findScrollView(tag: NSNumber?) -> UIScrollView? {
        guard let tag = tag, tag.intValue > 0 else { return nil }
        guard let bridge = RCTBridge.current() else { return nil }
        guard let uiManager = bridge.module(forName: "UIManager") as? RCTUIManager else { return nil }
        guard let view = uiManager.view(forReactTag: tag) else { return nil }
        return findScrollViewInHierarchy(view: view)
    }

    private func findScrollViewInHierarchy(view: UIView) -> UIScrollView? {
        if let scrollView = view as? UIScrollView {
            return scrollView
        }
        for subview in view.subviews {
            if let found = findScrollViewInHierarchy(view: subview) {
                return found
            }
        }
        return nil
    }

    @objc func initialize(_ accountId: String, pageTechnology: NSNumber?) {
        let accountIdInt = Int(accountId) ?? 0
        if let tech = pageTechnology?.intValue, tech > 0 {
            CompassTracker.initialize(accountId: accountIdInt, pageTechnology: tech)
        } else {
            CompassTracker.initialize(accountId: accountIdInt)
        }
    }

    @objc func trackNewPage(_ url: String, scrollViewTag: NSNumber?, rs: String?) {
        guard let pageUrl = URL(string: url) else { return }
        let scrollView = findScrollView(tag: scrollViewTag)
        CompassTracker.shared.trackNewPage(url: pageUrl, scrollView: scrollView, rs: rs)
    }

    @objc func trackScreen(_ screen: String, scrollViewTag: NSNumber?, rs: String?) {
        let scrollView = findScrollView(tag: scrollViewTag)
        CompassTracker.shared.trackScreen(name: screen, scrollView: scrollView, rs: rs)
    }

    @objc func stopTracking() {
        CompassTracker.shared.stopTracking()
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
        let mediaType: CompassSDK.`Type` = type == "audio" ? .AUDIO : .VIDEO

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
}
