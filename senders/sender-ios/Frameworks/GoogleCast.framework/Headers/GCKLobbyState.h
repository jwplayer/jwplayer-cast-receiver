// Copyright 2014 Google Inc.

/** @cond ENABLE_FEATURE_GAME_MANAGER */

#import <Foundation/Foundation.h>

/**
 * @file GCKLobbyState.h
 * GCKLobbyState enum
 */

/**
 * @enum GCKLobbyState
 * An enum describing game lobby states.
 */
typedef NS_ENUM(NSInteger, GCKLobbyState) {
  /** Unknown lobby state. */
  GCKLobbyStateUnknown = 0,
  /** Lobby is open and accepting players to join. */
  GCKLobbyStateOpen = 1,
  /** Lobby is closed and not accepting players. */
  GCKLobbyStateClosed = 2
};

/** @endcond */
