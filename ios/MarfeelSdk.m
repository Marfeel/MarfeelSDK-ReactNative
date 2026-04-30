#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(MarfeelSdk, NSObject)

RCT_EXTERN_METHOD(initialize:(NSString *)accountId pageTechnology:(nonnull NSNumber *)pageTechnology)
RCT_EXTERN_METHOD(trackNewPage:(NSString *)url rs:(NSString *)rs)
RCT_EXTERN_METHOD(trackScreen:(NSString *)screen rs:(NSString *)rs)
RCT_EXTERN_METHOD(updateScrollPercentage:(float)percentage)
RCT_EXTERN_METHOD(stopTracking)
RCT_EXTERN_METHOD(setLandingPage:(NSString *)landingPage)
RCT_EXTERN_METHOD(setSiteUserId:(NSString *)userId)
RCT_EXTERN_METHOD(getUserId:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(setUserType:(int)userType)
RCT_EXTERN_METHOD(getRFV:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(setPageVar:(NSString *)name value:(NSString *)value)
RCT_EXTERN_METHOD(setPageMetric:(NSString *)name value:(int)value)
RCT_EXTERN_METHOD(setSessionVar:(NSString *)name value:(NSString *)value)
RCT_EXTERN_METHOD(setUserVar:(NSString *)name value:(NSString *)value)
RCT_EXTERN_METHOD(addUserSegment:(NSString *)segment)
RCT_EXTERN_METHOD(setUserSegments:(NSArray *)segments)
RCT_EXTERN_METHOD(removeUserSegment:(NSString *)segment)
RCT_EXTERN_METHOD(clearUserSegments)
RCT_EXTERN_METHOD(trackConversion:(NSString *)conversion initiator:(NSString *)initiator id:(NSString *)id value:(NSString *)value meta:(NSDictionary *)meta scope:(NSString *)scope)
RCT_EXTERN_METHOD(setConsent:(BOOL)hasConsent)
RCT_EXTERN_METHOD(initializeMultimediaItem:(NSString *)id provider:(NSString *)provider providerId:(NSString *)providerId type:(NSString *)type metadata:(NSString *)metadata)
RCT_EXTERN_METHOD(registerMultimediaEvent:(NSString *)id event:(NSString *)event eventTime:(int)eventTime)

RCT_EXTERN_METHOD(recirculationTrackEligible:(NSString *)name links:(NSArray *)links)
RCT_EXTERN_METHOD(recirculationTrackImpression:(NSString *)name links:(NSArray *)links)
RCT_EXTERN_METHOD(recirculationTrackClick:(NSString *)name link:(NSDictionary *)link)

RCT_EXTERN_METHOD(experiencesAddTargeting:(NSString *)key value:(NSString *)value)
RCT_EXTERN_METHOD(experiencesFetch:(NSString *)filterByType
                  filterByFamily:(NSString *)filterByFamily
                  resolve:(BOOL)resolve
                  url:(NSString *)url
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(experiencesResolveContent:(NSString *)experienceId
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(experiencesTrackEligible:(NSString *)experienceId links:(NSArray *)links)
RCT_EXTERN_METHOD(experiencesTrackImpression:(NSString *)experienceId links:(NSArray *)links)
RCT_EXTERN_METHOD(experiencesTrackClick:(NSString *)experienceId link:(NSDictionary *)link)
RCT_EXTERN_METHOD(experiencesTrackClose:(NSString *)experienceId)

RCT_EXTERN_METHOD(experiencesClearFrequencyCaps)
RCT_EXTERN_METHOD(experiencesGetFrequencyCapCounts:(NSString *)experienceId
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(experiencesGetFrequencyCapConfig:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(experiencesClearReadEditorials)
RCT_EXTERN_METHOD(experiencesGetReadEditorials:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(experiencesGetExperimentAssignments:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(experiencesSetExperimentAssignment:(NSString *)groupId variantId:(NSString *)variantId)
RCT_EXTERN_METHOD(experiencesClearExperimentAssignments)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
