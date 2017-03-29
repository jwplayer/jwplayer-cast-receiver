// Copyright 2015 Google Inc.

#import <GoogleCast/GCKDefines.h>

#import <Foundation/Foundation.h>

#ifdef USE_CAST_DYNAMIC_FRAMEWORK
#define GCKRequestClass NSClassFromString(@"GCKRequest")
#endif

@class GCKError;
@protocol GCKRequestDelegate;

typedef NSInteger GCKRequestID;

GCK_ASSUME_NONNULL_BEGIN

/**
 * @enum GCKRequestAbortReason
 * Enum defining the reasons that could cause a request to be aborted.
 *
 * @since 3.0
 */
typedef NS_ENUM(NSInteger, GCKRequestAbortReason) {
  /** The request was aborted because a similar and overridding request was initiated. */
  GCKRequestAbortReasonReplaced = 1,
  /** The request was aborted after a call to @ref cancel on this request */
  GCKRequestAbortReasonCancelled = 2,
};

/**
 * An object for tracking an asynchronous request.
 *
 * See GCKRequestDelegate for the delegate protocol.
 *
 * @since 3.0
*/
GCK_EXPORT
@interface GCKRequest : NSObject

/**
 * The delegate for receiving notifications about the status of the request.
 */
@property(nonatomic, weak, readwrite, GCK_NULLABLE) id<GCKRequestDelegate> delegate;

/**
 * The unique ID assigned to this request.
 */
@property(nonatomic, assign, readonly) GCKRequestID requestID;

/**
 * The error that caused the request to fail, if any, otherwise <code>nil</code>.
 */
@property(nonatomic, copy, readonly, GCK_NULLABLE) GCKError *error;

/**
 * A flag indicating whether the request is currently in progress.
 */
@property(nonatomic, assign, readonly) BOOL inProgress;

/**
 * Cancels the request. Canceling a request does not guarantee that the request will not complete
 * on the receiver; it simply causes the sender to stop tracking the request.
 */
- (void)cancel;

@end

/**
 * The GCKRequest delegate protocol.
 *
 * @since 3.0
 */
GCK_EXPORT
@protocol GCKRequestDelegate <NSObject>

@optional

/**
 * Called when the request has successfully completed.
 *
 * @param request The request.
 */
- (void)requestDidComplete:(GCKRequest *)request;

/**
 * Called when the request has failed.
 *
 * @param request The request.
 * @param error The error describing the failure.
 */
- (void)request:(GCKRequest *)request didFailWithError:(GCKError *)error;

/**
 * Called when the request is no longer being tracked. It does not guarantee that the request has
 * succeed or failed.
 *
 * @param request The request.
 * @param abortReason The reason why the request is no longer being tracked.
 */
- (void)request:(GCKRequest *)request didAbortWithReason:(GCKRequestAbortReason)abortReason;

@end

GCK_ASSUME_NONNULL_END
