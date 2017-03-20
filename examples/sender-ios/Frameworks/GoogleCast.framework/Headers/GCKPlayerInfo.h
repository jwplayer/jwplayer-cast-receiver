// Copyright 2014 Google Inc.

/** @cond ENABLE_FEATURE_GAME_MANAGER */

#import <GoogleCast/GCKDefines.h>
#import <GoogleCast/GCKPlayerState.h>

#import <Foundation/Foundation.h>

#ifdef USE_CAST_DYNAMIC_FRAMEWORK
#define GCKPlayerInfoClass NSClassFromString(@"GCKPlayerInfo")
#endif

/**
 * @file GCKPlayerInfo.h
 */

GCK_ASSUME_NONNULL_BEGIN

/**
 * Represents data for a single player.
 */
GCK_EXPORT
@interface GCKPlayerInfo : NSObject

/**
 * The unique string identifier of this player.
 */
@property(nonatomic, copy, readonly) NSString *playerID;

/**
 * The current state of the player.
 */
@property(nonatomic, assign, readonly) GCKPlayerState playerState;

/**
 * Player-specific data defined by the game. This data is persisted while the game is
 * running. Will be either an object that can be serialized to JSON
 * using <a href="https://goo.gl/0vd4Q2"><b>NSJSONSerialization</b></a>, or <code>nil</code>.
 */
@property(nonatomic, copy, readonly, GCK_NULLABLE) id playerData;

/**
 * True if this player is in a connected state. A player is considered to be in a connected state if
 * the associated GCKPlayerInfo::playerState is one of @ref GCKPlayerStateAvailable,
 * @ref GCKPlayerStateReady, @ref GCKPlayerStateIdle, or @ref GCKPlayerStatePlaying.
 */
@property(nonatomic, assign, readonly) BOOL isConnected;

/**
 * True if this player is was created on this sender device.
 */
@property(nonatomic, assign, readonly) BOOL isControllable;

@end

GCK_ASSUME_NONNULL_END

/** @endcond */
