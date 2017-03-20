// Copyright 2014 Google Inc.

/** @cond ENABLE_FEATURE_GAME_MANAGER */

#import <GoogleCast/GCKCastChannel.h>
#import <GoogleCast/GCKGameManagerState.h>
#import <GoogleCast/GCKGameplayState.h>
#import <GoogleCast/GCKLobbyState.h>
#import <GoogleCast/GCKPlayerState.h>

#import <Foundation/Foundation.h>

#ifdef USE_CAST_DYNAMIC_FRAMEWORK
#define GCKGameManagerChannelClass NSClassFromString(@"GCKGameManagerChannel")
#endif

/**
 * @file GCKGameManagerChannel.h
 * GCKGameManagerChannel and GCKGameManagerChannelDelegate
 */

@class GCKError;
@class GCKGameManagerResult;
@protocol GCKGameManagerChannelDelegate;

GCK_ASSUME_NONNULL_BEGIN

/**
 * A GCKCastChannel subclass for game control operations.
 *
 * See GCKGameManagerChannelDelegate for the delegate protocol.
 */
GCK_EXPORT
@interface GCKGameManagerChannel : GCKCastChannel

/**
 * The delegate for receiving notifications from the GCKGameManagerChannel.
 */
@property(nonatomic, weak, readwrite, GCK_NULLABLE) id<GCKGameManagerChannelDelegate> delegate;

/**
 * The current state of the game manager.
 */
@property(nonatomic, strong, readonly, GCK_NULLABLE) GCKGameManagerState *currentState;

/**
 * The last controllable player ID used in this session. This can be <code>nil</code>
 * if there is no controllable player set up with the receiver.
 *
 * @see sendPlayerAvailableRequest:
 */
@property(nonatomic, copy, readonly, GCK_NULLABLE) NSString *lastUsedPlayerID;

/**
 * Whether this channel is connected with the receiver's Game Manager and we are ready to interact
 * with it. This method will return <code>NO</code> from the point of creation of this channel.
 * @return <code>YES</code> if this channel is connected to the receiver's Game Manager and ready to
 * interact it; <code>NO</code> otherwise.
 */
@property(nonatomic, assign, readonly) BOOL isInitialConnectionEstablished;

/**
 * Designated initializer. Automatically connects to receiver's Game Manager.
 *
 * @param castSessionID The Session ID corresponding to the currently connected Game Manager.
 */
- (instancetype)initWithSessionID:(NSString *)castSessionID NS_DESIGNATED_INITIALIZER;

/**
 * Sends a request to the receiver to put the last used player on this sender into the
 * @ref GCKPlayerStateAvailable state. If this is not a valid transition for that player an error
 * will be triggered in the GCKGameManagerChannelDelegate. If there is no last used player, a new
 * player will be registered and its player ID will be set as the last used player ID when the
 * receiver responds to this request. This method should only be called after the
 * GCKGameManagerChannelDelegate::gameManagerChannelDidConnect: delegate callback has been messaged.
 * Messages the GCKGameManagerChannelDelegate::gameManagerChannel:requestDidFailWithID:error:
 * delegate callback if the GCKGameManagerChannel is not yet connected to the receiver's Game
 * Manager.
 *
 * @see lastUsedPlayerID
 *
 * @param extraData Custom application-specific data to pass along with the request. Must either
 * be an object that can be serialized to JSON using
 * <a href="https://goo.gl/0vd4Q2"><b>NSJSONSerialization</b></a>, or <code>nil</code>.
 * @return The request ID, or @ref kGCKInvalidRequestID if the request could not be sent.
 */
- (NSInteger)sendPlayerAvailableRequest:(id GCK_NULLABLE_TYPE)extraData;

/**
 * Sends a request to the receiver to put the player into the @ref GCKPlayerStateAvailable state. If
 * this is not a valid transition for that player an error will be triggered in the
 * GCKGameManagerChannelDelegate. If the player ID is <code>nil</code> a new player will be
 * registered and its player ID will be set as the last used player ID when the receiver responds to
 * this request. This method should only be called after the
 * GCKGameManagerChannelDelegate::gameManagerChannelDidConnect: delegate callback has been messaged.
 * Messages the GCKGameManagerChannelDelegate::gameManagerChannel:requestDidFailWithID:error:
 * delegate callback if the GCKGameManagerChannel is not yet connected to the receiver's Game
 * Manager.
 *
 * @param extraData Custom application-specific data to pass along with the request. Must either
 * be an object that can be serialized to JSON using
 * <a href="https://goo.gl/0vd4Q2"><b>NSJSONSerialization</b></a>, or <code>nil</code>.
 * @param playerID The player ID of the player whose state is to be changed.
 * @return The request ID, or @ref kGCKInvalidRequestID if the request could not be sent.
 */
- (NSInteger)sendPlayerAvailableRequest:(id GCK_NULLABLE_TYPE)extraData
                               playerID:(NSString *)playerID;

/**
 * Sends a request to the receiver to put the last used player on this sender into the
 * @ref GCKPlayerStateReady state. If this is not a valid transition for that player or if there is
 * no last used player ID, an error will be triggered in the GCKGameManagerChannelDelegate. This
 * method should only be called after the
 * GCKGameManagerChannelDelegate::gameManagerChannelDidConnect: delegate callback has been messaged.
 * Messages the GCKGameManagerChannelDelegate::gameManagerChannel:requestDidFailWithID:error:
 * delegate callback if the GCKGameManagerChannel is not yet connected to the receiver's Game
 * Manager.
 *
 * @see lastUsedPlayerID
 *
 * @param extraData Custom application-specific data to pass along with the request. Must either
 * be an object that can be serialized to JSON using
 * <a href="https://goo.gl/0vd4Q2"><b>NSJSONSerialization</b></a>, or <code>nil</code>.
 * @return The request ID, or @ref kGCKInvalidRequestID if the request could not be sent.
 */
- (NSInteger)sendPlayerReadyRequest:(id GCK_NULLABLE_TYPE)extraData;

/**
 * Sends a request to the receiver to put the player into the {@link GCKPlayerStateReady}
 * state. If this is not a valid transition for that player or if there is no last used player ID,
 * an error will be triggered in the GCKGameManagerChannelDelegate.
 * This method should only be called after the
 * GCKGameManagerChannelDelegate::gameManagerChannelDidConnect: delegate callback has been messaged.
 * Messages the GCKGameManagerChannelDelegate::gameManagerChannel:requestDidFailWithID:error:
 * delegate callback if the GCKGameManagerChannel is not yet connected to the receiver's Game
 * Manager.
 *
 * @param extraData Custom application-specific data to pass along with the request. Must either
 * be an object that can be serialized to JSON using
 * <a href="https://goo.gl/0vd4Q2"><b>NSJSONSerialization</b></a>, or <code>nil</code>.
 * @param playerID The player ID of the player to change the state.
 * @return The request ID, or @ref kGCKInvalidRequestID if the request could not be sent.
 */
- (NSInteger)sendPlayerReadyRequest:(id GCK_NULLABLE_TYPE)extraData playerID:(NSString *)playerID;

/**
 * Sends a request to the receiver to put the last used player on this sender into the
 * @ref GCKPlayerStatePlaying state. If this is not a valid transition for that player or if there
 * is no last used player ID, an error will be triggered in the GCKGameManagerChannelDelegate.
 * This method should only be called after the
 * GCKGameManagerChannelDelegate::gameManagerChannelDidConnect: delegate callback has been messaged.
 * Messages the GCKGameManagerChannelDelegate::gameManagerChannel:requestDidFailWithID:error:
 * delegate callback if the GCKGameManagerChannel is not yet connected to the receiver's Game
 * Manager.
 *
 * @see lastUsedPlayerID
 *
 * @param extraData Custom application-specific data to pass along with the request. Must either
 * be an object that can be serialized to JSON using
 * <a href="https://goo.gl/0vd4Q2"><b>NSJSONSerialization</b></a>, or <code>nil</code>.
 * @return The request ID, or @ref kGCKInvalidRequestID if the request could not be sent.
 */
- (NSInteger)sendPlayerPlayingRequest:(id GCK_NULLABLE_TYPE)extraData;

/**
 * Sends a request to the receiver to put the player into the @ref GCKPlayerStatePlaying state. If
 * this is not a valid transition for that player or if there is no last used player ID, an error
 * will be triggered in the GCKGameManagerChannelDelegate. This method should only be called after
 * the GCKGameManagerChannelDelegate::gameManagerChannelDidConnect: delegate callback has been
 * messaged. Messages the
 * GCKGameManagerChannelDelegate::gameManagerChannel:requestDidFailWithID:error: delegate callback
 * if the GCKGameManagerChannel is not yet connected to the receiver's Game Manager.
 *
 * @param extraData Custom application-specific data to pass along with the request. Must either
 * be an object that can be serialized to JSON using
 * <a href="https://goo.gl/0vd4Q2"><b>NSJSONSerialization</b></a>, or <code>nil</code>.
 * @param playerID The player ID of the player to change the state.
 * @return The request ID, or @ref kGCKInvalidRequestID if the request could not be sent.
 */
- (NSInteger)sendPlayerPlayingRequest:(id GCK_NULLABLE_TYPE)extraData playerID:(NSString *)playerID;

/**
 * Sends a request to the receiver to put the last used player on this sender into the
 * @ref GCKPlayerStateIdle state. If this is not a valid transition for that player or if there is
 * no last used player ID, an error will be triggered in the GCKGameManagerChannelDelegate. This
 * method should only be called after GCKGameManagerChannelDelegate::gameManagerChannelDidConnect:
 * delegate callback has been messaged. Messages the
 * GCKGameManagerChannel::gameManagerChannel:requestDidFailWithID:error: delegate callback if
 * the GCKGameManagerChannel is not yet connected to the receiver's Game Manager.
 *
 * @see lastUsedPlayerID
 *
 * @param extraData Custom application-specific data to pass along with the request. Must either
 * be an object that can be serialized to JSON using
 * <a href="https://goo.gl/0vd4Q2"><b>NSJSONSerialization</b></a>, or <code>nil</code>.
 * @return The request ID, or @ref kGCKInvalidRequestID if the request could not be sent.
 */
- (NSInteger)sendPlayerIdleRequest:(id GCK_NULLABLE_TYPE)extraData;

/**
 * Sends a request to the receiver to put the player into the @ref GCKPlayerStateIdle state. If this
 * is not a valid transition for that player or if there is no last used player ID, an error will be
 * triggered in the GCKGameManagerChannelDelegate. This method should only be called after the
 * GCKGameManagerChannelDelegate::gameManagerChannelDidConnect: delegate callback has been messaged.
 * Messages the GCKGameManagerChannelDelegate::gameManagerChannel:requestDidFailWithID:error:
 * delegate callback if the GCKGameManagerChannel is not yet connected to the receiver's Game
 * Manager.
 *
 * @param extraData Custom application-specific data to pass along with the request. Must either
 * be an object that can be serialized to JSON using
 * <a href="https://goo.gl/0vd4Q2"><b>NSJSONSerialization</b></a>, or <code>nil</code>.
 * @param playerID The player ID of the player to change the state.
 * @return The request ID, or @ref kGCKInvalidRequestID if the request could not be sent.
 */
- (NSInteger)sendPlayerIdleRequest:(id GCK_NULLABLE_TYPE)extraData playerID:(NSString *)playerID;

/**
 * Sends a request to the receiver to put the last used player on this sender into the
 * @ref GCKPlayerStateQuit state. If this is not a valid transition for that player or if there is
 * no last used player ID, an error will be triggered in the GCKGameManagerChannelDelegate. This
 * method should only be called after the
 * GCKGameManagerChannelDelegate::gameManagerChannelDidConnect: delegate callback has been messaged.
 * Messages the GCKGameManagerChannelDelegate::gameManagerChannel:requestDidFailWithID:error:
 * delegate callback if the GCKGameManagerChannel is not yet connected to the receiver's Game
 * Manager.
 *
 * @see lastUsedPlayerID
 *
 * @param extraData Custom application-specific data to pass along with the request. Must either
 * be an object that can be serialized to JSON using
 * <a href="https://goo.gl/0vd4Q2"><b>NSJSONSerialization</b></a>, or <code>nil</code>.
 * @return The request ID, or @ref kGCKInvalidRequestID if the request could not be sent.
 */
- (NSInteger)sendPlayerQuitRequest:(id GCK_NULLABLE_TYPE)extraData;

/**
 * Sends a request to the receiver to put the player into the @ref GCKPlayerStateQuit state. If this
 * is not a valid transition for that player or if there is no last used player ID, an error will be
 * triggered in the GCKGameManagerChannelDelegate. This method should only be called after the
 * GCKGameManagerChannelDelegate::gameManagerChannelDidConnect: delegate callback has been messaged.
 * Messages the GCKGameManagerChannelDelegate::gameManagerChannel:requestDidFailWithID:error:
 * delegate callback if the GCKGameManagerChannel is not yet connected to receiver's Game Manager.
 *
 * @param extraData Custom application-specific data to pass along with the request. Must either
 * be an object that can be serialized to JSON using
 * <a href="https://goo.gl/0vd4Q2"><b>NSJSONSerialization</b></a>, or <code>nil</code>.
 * @param playerID The player ID of the player to change the state.
 * @return The request ID, or @ref kGCKInvalidRequestID if the request could not be sent.
 */
- (NSInteger)sendPlayerQuitRequest:(id GCK_NULLABLE_TYPE)extraData playerID:(NSString *)playerID;

/**
 * Sends a game-specific message to the receiver. The message contents are entirely up to the
 * application. The message will originate from @ref lastUsedPlayerID.
 * The receiver will send a response back to this sender via the GCKGameManagerChannelDelegate.
 * This method should only be called after the
 * GCKGameManagerChannelDelegate::gameManagerChannelDidConnect: delegate callback has been messaged.
 * Messages the GCKGameManagerChannelDelegate::gameManagerChannel:requestDidFailWithID:error:
 * delegate callback if the GCKGameManagerChannel is not yet connected to the receiver GameManager.
 * @param extraData Custom application-specific data to pass along with the request. Must either
 * be an object that can be serialized to JSON using
 * <a href="https://goo.gl/0vd4Q2"><b>NSJSONSerialization</b></a>, or <code>nil</code>.
 * @return The request ID, or @ref kGCKInvalidRequestID if the request could not be sent.
 */
- (NSInteger)sendGameRequest:(id GCK_NULLABLE_TYPE)extraData;

/**
 * Sends a game-specific message to the receiver. The message contents are entirely up to the
 * application. The message will originate from @p playerID. If @p playerID is <code>nil</code>,
 * @ref lastUsedPlayerID will be used. The receiver will send a response back to this sender via the
 * GCKGameManagerChannelDelegate. This method should only be called after the
 * GCKGameManagerChannelDelegate::gameManagerChannelDidConnect: delegate callback has been messaged.
 * Messages the GCKGameManagerChannelDelegate::gameManagerChannel:requestDidFailWithID:error:
 * delegate callback if the GCKGameManagerChannel is not yet connected to the receiver's Game
 * Manager.
 *
 * @param extraData Custom application-specific data to pass along with the request. Must either
 * be an object that can be serialized to JSON using
 * <a href="https://goo.gl/0vd4Q2"><b>NSJSONSerialization</b></a>, or <code>nil</code>.
 * @param playerID The id of the controllable player sending this message.
 * @return The request ID, or @ref kGCKInvalidRequestID if the request could not be sent.
 */
- (NSInteger)sendGameRequest:(id GCK_NULLABLE_TYPE)extraData playerID:(NSString *)playerID;

/**
 * Sends a game-specific message to the receiver. The message contents are entirely up to the
 * application. The message will originate from @ref lastUsedPlayerID. This is a fire-and-forget
 * method where there's no guarantee that the message has been sent and the receiver won't send a
 * response back to this sender. This method should only be called after the
 * GCKGameManagerChannelDelegate::gameManagerChannelDidConnect:  delegate callback has been
 * messaged. Messages the
 * GCKGameManagerChannelDelegate::gameManagerChannel:requestDidFailWithID:error: delegate callback
 * if the GCKGameManagerChannel is not yet connected to the receiver's Game Manager.
 *
 * @param extraData Custom application-specific data to pass along with the request. Must either
 * be an object that can be serialized to JSON using
 * <a href="https://goo.gl/0vd4Q2"><b>NSJSONSerialization</b></a>, or <code>nil</code>.
 */
- (void)sendGameMessage:(id GCK_NULLABLE_TYPE)extraData;

/**
 * Sends a game-specific message to the receiver. THe message contents are entirely up to the
 * application. The message will originate from the specified local player ID. This is a fire
 * and forget method where there's no guarantee the message is sent and the receiver
 * won't send a response back to this sender.
 * This method should only be called after the
 * GCKGameManagerChannelDelegate::gameManagerChannelDidConnect: delegate callback has been messaged.
 * Messages the GCKGameManagerChannelDelegate::gameManagerChannel:requestDidFailWithID:error:
 * delegate callback if the GCKGameManagerChannel is not yet connected to the receiver's Game
 * Manager.
 *
 * @param extraData Custom application-specific data to pass along with the request. Must either
 * be an object that can be serialized to JSON using
 * <a href="https://goo.gl/0vd4Q2"><b>NSJSONSerialization</b></a>, or <code>nil</code>.
 * @param playerID The ID of the controllable player sending this message.
 */
- (void)sendGameMessage:(id GCK_NULLABLE_TYPE)extraData playerID:(NSString *)playerID;

@end

/**
 * The GCKGameManagerChannel delegate protocol.
 */
GCK_EXPORT
@protocol GCKGameManagerChannelDelegate <NSObject>

/**
 * Called when the Game Manager state has changed.
 *
 * @param gameManagerChannel The affected GCKGameManagerChannel.
 * @param currentState The current state.
 * @param previousState The previous state.
 */
- (void)gameManagerChannel:(GCKGameManagerChannel *)gameManagerChannel
          stateDidChangeTo:(GCKGameManagerState *)currentState
                      from:(GCKGameManagerState *)previousState;

/**
 * Called when the receiver sends a game message for a specific player.
 *
 * @param gameManagerChannel The affected GCKGameManagerChannel.
 * @param gameMessage The game message sent by the receiver.
 * @param playerID The player ID associated with the game message.
 */
- (void)gameManagerChannel:(GCKGameManagerChannel *)gameManagerChannel
     didReceiveGameMessage:(id)gameMessage
               forPlayerID:(NSString *)playerID;

/**
 * Called when a player request or game request was successful.
 *
 * @param gameManagerChannel The affected GCKGameManagerChannel.
 * @param requestID The request ID that failed. This is the ID returned when the request was made.
 * @param result The GCKGameManagerResult returned as part of this request response.
 */
- (void)gameManagerChannel:(GCKGameManagerChannel *)gameManagerChannel
    requestDidSucceedWithID:(NSInteger)requestID
                     result:(GCKGameManagerResult *)result;

/**
 * Called when a player request or game request failed with an error.
 *
 * @param gameManagerChannel The affected GCKGameManagerChannel.
 * @param requestID The request ID that failed. This is the ID returned when the request was made.
 * @param error The error describing the failure.
 */
- (void)gameManagerChannel:(GCKGameManagerChannel *)gameManagerChannel
      requestDidFailWithID:(NSInteger)requestID
                     error:(GCKError *)error;

@required

/**
 * Called when the receiver's Game Manager connects successfully and we are ready to interact with
 * it.
 *
 * @param gameManagerChannel The affected GCKGameManagerChannel.
 */
- (void)gameManagerChannelDidConnect:(GCKGameManagerChannel *)gameManagerChannel;

/**
 * Called when the receiver's Game Manager encounters an error during connection.
 *
 * @param gameManagerChannel The affected GCKGameManagerChannel.
 * @param error The error describing the failure.
 */
- (void)gameManagerChannel:(GCKGameManagerChannel *)gameManagerChannel
    didFailToConnectWithError:(GCKError *)error;

@end

GCK_ASSUME_NONNULL_END

/** @endcond */
