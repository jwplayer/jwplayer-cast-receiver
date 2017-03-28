// Copyright 2013 Google Inc.

#import <GoogleCast/GCKAdBreakClipInfo.h>
#import <GoogleCast/GCKAdBreakInfo.h>
#import <GoogleCast/GCKDefines.h>

#import <Foundation/Foundation.h>

#ifdef USE_CAST_DYNAMIC_FRAMEWORK
#define GCKMediaInformationClass NSClassFromString(@"GCKMediaInformation")
#endif

@class GCKMediaMetadata;
@class GCKMediaTextTrackStyle;
@class GCKMediaTrack;

/**
 * @file GCKMediaInformation.h
 * GCKMediaStreamType enum.
 */

GCK_ASSUME_NONNULL_BEGIN

/**
 * @enum GCKMediaStreamType
 * Enum defining the media stream type.
 */
typedef NS_ENUM(NSInteger, GCKMediaStreamType) {
  /** A stream type of "none". */
  GCKMediaStreamTypeNone = 0,
  /** A buffered stream type. */
  GCKMediaStreamTypeBuffered = 1,
  /** A live stream type. */
  GCKMediaStreamTypeLive = 2,
  /** An unknown stream type. */
  GCKMediaStreamTypeUnknown = 99,
};

/**
 * A class that aggregates information about a media item.
 */
GCK_EXPORT
@interface GCKMediaInformation : NSObject <NSCopying>

/**
 * The content ID for this stream.
 */
@property(nonatomic, copy, readonly) NSString *contentID;

/**
 * The stream type.
 */
@property(nonatomic, readonly) GCKMediaStreamType streamType;

/**
 * The content (MIME) type.
 */
@property(nonatomic, copy, readonly) NSString *contentType;

/**
 * The media item metadata.
 */
@property(nonatomic, strong, readonly, GCK_NULLABLE) GCKMediaMetadata *metadata;

/**
 * The list of ad breaks in this content.
 */
@property(nonatomic, copy, readonly, GCK_NULLABLE) NSArray<GCKAdBreakInfo *> *adBreaks;

/**
 * The list of ad break clips in this content.
 *
 * @since 3.3
 */
@property(nonatomic, copy, readonly, GCK_NULLABLE) NSArray<GCKAdBreakClipInfo *> *adBreakClips;

/**
 * The length of the stream, in seconds, or <code>INFINITY</code> if it is a live stream.
 */
@property(nonatomic, readonly) NSTimeInterval streamDuration;

/**
 * The media tracks for this stream.
 */
@property(nonatomic, copy, readonly, GCK_NULLABLE) NSArray<GCKMediaTrack *> *mediaTracks;

/**
 * The text track style for this stream.
 */
@property(nonatomic, copy, readonly, GCK_NULLABLE) GCKMediaTextTrackStyle *textTrackStyle;

/**
 * The custom data, if any.
 */
@property(nonatomic, strong, readonly, GCK_NULLABLE) id customData;

/**
 * Designated initializer.
 *
 * @param contentID The content ID.
 * @param streamType The stream type.
 * @param contentType The content (MIME) type.
 * @param metadata The media item metadata.
 * @param streamDuration The stream duration.
 * @param mediaTracks The media tracks, if any, otherwise <code>nil</code>.
 * @param textTrackStyle The text track style, if any, otherwise <code>nil</code>.
 * @param customData The custom application-specific data. Must either be an object that can be
 * serialized to JSON using <a href="https://goo.gl/0vd4Q2"><b>NSJSONSerialization</b></a>, or
 * <code>nil</code>.
 */
- (instancetype)initWithContentID:(NSString *)contentID
                       streamType:(GCKMediaStreamType)streamType
                      contentType:(NSString *)contentType
                         metadata:(GCKMediaMetadata *GCK_NULLABLE_TYPE)metadata
                   streamDuration:(NSTimeInterval)streamDuration
                      mediaTracks:(NSArray<GCKMediaTrack *> *GCK_NULLABLE_TYPE)mediaTracks
                   textTrackStyle:(GCKMediaTextTrackStyle *GCK_NULLABLE_TYPE)textTrackStyle
                       customData:(id GCK_NULLABLE_TYPE)customData;

/**
 * Legacy initializer; does not include media tracks or text track style.
 *
 * @param contentID The content ID.
 * @param streamType The stream type.
 * @param contentType The content (MIME) type.
 * @param metadata The media item metadata.
 * @param streamDuration The stream duration.
 * @param customData Custom application-specific data. Must either be an object that can be
 * serialized to JSON using <a href="https://goo.gl/0vd4Q2"><b>NSJSONSerialization</b></a>, or
 * <code>nil</code>.
 *
 * @deprecated Use the designated initializer.
 */
- (instancetype)initWithContentID:(NSString *)contentID
                       streamType:(GCKMediaStreamType)streamType
                      contentType:(NSString *)contentType
                         metadata:(GCKMediaMetadata *GCK_NULLABLE_TYPE)metadata
                   streamDuration:(NSTimeInterval)streamDuration
                       customData:(id GCK_NULLABLE_TYPE)customData;

/**
 * Searches for a media track with the given track ID.
 *
 * @param trackID The media track ID.
 * @return The matching GCKMediaTrack object, or <code>nil</code> if there is no media track
 * with the given ID.
 */
- (GCKMediaTrack *GCK_NULLABLE_TYPE)mediaTrackWithID:(NSInteger)trackID;

@end

GCK_ASSUME_NONNULL_END
