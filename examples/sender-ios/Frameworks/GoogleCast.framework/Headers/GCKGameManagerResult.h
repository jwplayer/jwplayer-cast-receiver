// Copyright 2014 Google Inc.

/** @cond ENABLE_FEATURE_GAME_MANAGER */

#import <GoogleCast/GCKDefines.h>

#import <Foundation/Foundation.h>

#ifdef USE_CAST_DYNAMIC_FRAMEWORK
#define GCKGameManagerResultClass NSClassFromString(@"GCKGameManagerResult")
#endif

/**
 * @file GCKGameManagerResult.h
 * GCKGameManagerResult definition.
 */

GCK_ASSUME_NONNULL_BEGIN

/**
 * The result of a Game Manager request.
 */
GCK_EXPORT
@interface GCKGameManagerResult : NSObject

/**
 * The request ID associated with this response.
 */
@property(nonatomic, assign, readonly) NSInteger requestID;

/**
 * The player ID associated with this response.
 */
@property(nonatomic, copy, readonly) NSString *playerID;

/**
 * Extra message data stored as part of this response.
 */
@property(nonatomic, copy, readonly) id extraData;

@end

GCK_ASSUME_NONNULL_END

/** @endcond */
