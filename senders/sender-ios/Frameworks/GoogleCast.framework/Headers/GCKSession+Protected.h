// Copyright 2015 Google Inc.

#import <GoogleCast/GCKSession.h>

#import <GoogleCast/GCKDefines.h>

#import <Foundation/Foundation.h>

GCK_ASSUME_NONNULL_BEGIN

/**
 * Methods to be overridden and called by GCKSession subclasses only.
 *
 * @since 3.0
 */
@interface GCKSession (Protected)

/**
 * Starts the session. This is an asynchronous operation. Must be overridden by subclasses.
 */
- (void)start;

/**
 * Ends the session. This is an asynchronous operation. Must be overridden by subclasses.
 *
 * @param stopCasting Whether to stop casting content to the receiver.
 */
- (void)endAndStopCasting:(BOOL)stopCasting;

/**
 * Suspends the session for the given reason. This is an asynchronous operation. Must be overridden
 * by subclasses.
 */
- (void)suspendWithReason:(GCKConnectionSuspendReason)reason;

/**
 * Resumes the session. This is an asynchronous operation. Must be overridden by subclasses.
 */
- (void)resume;

/**
 * Called by subclasses to notify the framework that the session has been started.
 *
 * @param sessionID The session's unique ID.
 */
- (void)notifyDidStartWithSessionID:(NSString *)sessionID;

/**
 * Called by subclasses to notify the framework that the session has failed to start.
 *
 * @param error The error that occurred.
 */
- (void)notifyDidFailToStartWithError:(NSError *)error;

/**
 * Called by subclasses to notify the framework that the session been resumed.
 */
- (void)notifyDidResume;

/**
 * Called by subclasses to notify the framework that the session has been suspended.
 *
 * @param reason The reason for the suspension.
 */
- (void)notifyDidSuspendWithReason:(GCKConnectionSuspendReason)reason;

/**
 * Called by subclasses to notify the framework that the session has ended.
 *
 * @param error The error that caused the session to end, if any. Should be <code>nil</code> if the
 * session was ended intentionally.
 */
- (void)notifyDidEndWithError:(NSError *GCK_NULLABLE_TYPE)error;

/**
 * Called by subclasses to notify the framework that updated device volume and mute state has been
 * received from the device.
 *
 * @param volume The device's current volume. Must be in the range [0, 1.0];
 * @param muted The device's current mute state.
 */
- (void)notifyDidReceiveDeviceVolume:(float)volume muted:(BOOL)muted;

/**
 * Called by subclasses to notify the framework that updated status has been received from the
 * device.
 *
 * @param statusText The new status.
 */
- (void)notifyDidReceiveDeviceStatus:(NSString *GCK_NULLABLE_TYPE)statusText;

@end

GCK_ASSUME_NONNULL_END
