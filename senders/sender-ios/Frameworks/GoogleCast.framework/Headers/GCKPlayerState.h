// Copyright 2014 Google Inc.

/** @cond ENABLE_FEATURE_GAME_MANAGER */

#import <Foundation/Foundation.h>

/**
 * @file GCKPlayerState.h
 * GCKPlayerState enum
 */

/**
 * @enum GCKPlayerState
 * An enum describing player states.
 */
typedef NS_ENUM(NSInteger, GCKPlayerState) {
  /**
   * Unknown player state.
   */
  GCKPlayerStateUnknown = 0,
  /**
   * The player is no longer connected to the receiver because of a network drop.
   */
  GCKPlayerStateDropped = 1,
  /**
   * The player has manually chosen to disconnect from the receiver.
   */
  GCKPlayerStateQuit = 2,
  /**
   * The player is connected to the receiver and available to join a game.
   */
  GCKPlayerStateAvailable = 3,
  /**
   * The player is connected to the receiver, and ready to enter the game.
   */
  GCKPlayerStateReady = 4,
  /**
   * The player is connected to the receiver, in the game, and idle.
   */
  GCKPlayerStateIdle = 5,
  /**
   * The player is connected to the receiver, in the game, and actively playing.
   */
  GCKPlayerStatePlaying = 6
};

/** @endcond */
