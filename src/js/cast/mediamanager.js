// TODO: skip ad support: playerInstance.skipAd();
import * as Events from '../events';
import { PlayerState } from './playerstate';
import { RepeatMode } from './repeatmode';
import { Command } from './command';
import { EventType, ErrorType, MessageType, ErrorReason, SeekResumeState, IdleReason } from './messages';
import { TrackType, TextTrackType } from './tracktype';
import AdBreakInfo from './ads/adbreakinfo';
import AdBreakClipInfo from './ads/adbreakclipinfo';
import AdBreakStatus from './ads/adbreakstatus';
import AdMeta from './ads/admeta';
import AdCompanion from './ads/adcompanion';

/**
 * Supported features of this {@link MediaManager}.
 *
 * Supported features are expressed as a summation of the supported
 * commands.
 *
 * @type {number}
 */
const SUPPORTED_FEATURES = Command.ALL_BASIC_MEDIA
    + Command.QUEUE_NEXT
    + Command.QUEUE_PREV
    + Command.QUEUE_SHUFFLE;

/**
 * Flags which are being used when serializing the mediaStatus.
 *
 * These flags have to be set in order to serialize certain elements of
 * the mediaStatus.
 *
 * @readonly
 * @enum {string}
 */
// export const MediaStatusFlags = {
//   QUEUE: 'items'
//   META: 'media'
// };

/**
 * Track index 0 always disables a track on the JW Player.
 *
 * @readonly
 */
const TRACK_DISABLED = 0;

export const ERROR_TIMEOUT = 5000;

/**
 * A cast.receiver.media.MediaManager implementation for JW Player.
 *
 * The MediaManager manages a JW Player, receives commands from senders, acts appropriately
 * on them and updates senders with status changes.
 *
 * @param {cast.receiver.ReceiverManager} receiverManager The ReceiverManager singleton.
 * @param {HTMLElement} container the container jwplayer.js can be attached to.
 */
export default class JWMediaManager {
    constructor(receiverManager, container, events, analyticsConfig) {
        this.receiverManager = receiverManager;
        this.playerManager = this.receiverManager.getPlayerManager();
        this.container = container;
        this.events = events;
        this.analyticsConfig = analyticsConfig;
        // The current JW Player instance.
        // TODO: make this an object, which allows for multiple playerInstances per mediaSessionId
        // so we can do preloading.
        this.playerInstance;
        // Represents the status of a media session.
        this.mediaStatus;
        /**
         * By default we do not serialize the entire media status.
         * The following elements should be set in this block if theycast.receiver.media.MediaStatus
         * should be serialized.
         *
         * This object is used to set the flags for which elements in the media
         * status should be serialized.
         */
            // let mediaStatusFlags = [];

        // The requestId that will be associated with the next status update.
        // So that senders can correlate their actions with a status update.
        this.currentRequestId = 0;
        // Whether we are currently processing a load request.
        this.isLoading = false;
        // The last time an ad pod was initiated.
        this.adPodStartTime = 0;

        // Start listening for messages.
        // https://developers.google.com/cast/docs/web_receiver/core_features following CAF changes
        this.playerManager.addEventListener(EventType.ALL, this.dispatchEvent.bind(this));
    }

    /**
     * Broadcasts a message to every connected sender.
     * @param  {Object} message The message to send to senders.
     */
    broadcastMessage(message) {
        try {
            // second argument is for senderId. If no senderId, cast receiver context sends message to ALL senders.
            this.receiverManager.sendCustomMessage('urn:x-cast:jw.custom.receiver', '', JSON.stringify(message));
        } catch (err) {
            console.warn('Unable to broadcast message: %O', err);
        }
    }

    /**
     * Sends a message to a specific sender.
     * @param  {string} senderId The identifier of the sender to send a message to.
     * @param  {Object} message  The message to send.
     */
    sendMessage(senderId, message) {
        try {
            this.receiverManager.sendCustomMessage('urn:x-cast:jw.custom.receiver', senderId, JSON.stringify(message));
        } catch (err) {
            console.warn('Unable to send message: %O', err);
        }
    }

    /**
     * Dispatches a message to the message handler for a specific event.
     * Also does validation of messages.
     *
     * @param  {Object} message The message to dispatch.
     */
    dispatchEvent(message) {
        // Check if the message contains data.
        if (!message) {
            return;
        }
        if (!message.type) {
            // err: invalid request.
            this.sendErrorInvalidRequest(event, ErrorReason.INVALID_COMMAND);
            return;
        }
        let event = {
            senderId: message.senderId ? message.senderId : null,
            data: message.requestData ? message.requestData : message,
            type: message.type ? message.type : null,
        };

        // Broadcast that user activity has occured so that the UI
        // can be updated appropriately.
        // TODO: we might want to limit USER_ACTIVITY to a subset of
        // events.
        if (event.type != EventType.GET_STATUS) {
            this.events.publish(Events.USER_ACTIVITY, {
                reason: event.type
            });
        }
        // First see if we need to handle any events that create
        // mediaSessions, or don't need one to be handled.
        switch (event.type) {
            case EventType.LOADED_DATA:
                this.onLoad(event);
                return;
            case EventType.REQUEST_QUEUE_LOAD:
                this.onQueueLoad(event);
                return;
            case EventType.GET_STATUS:
                this.onGetStatus(event);
                return;
            default:
                break;
        }
        // We're handling an event that doesn't create a media session
        // first, let's do some validation before we dispatch anything.
        if (!this.mediaStatus) {
            this.sendErrorInvalidPlayerState(event);
            return;
        }

        if (event.data && event.data.requestId) {
            this.currentRequestId = event.data.requestId;
        }

        // Message looks good so far, proceed with dispatching it.
        switch (event.type) {
            case EventType.REQUEST_STOP:
                this.onStop(event);
                break;
            case EventType.REQUEST_PAUSE:
                this.onPause(event);
                break;
            case EventType.REQUEST_PLAY:
                this.onPlay(event);
                break;
            case EventType.REQUEST_SEEK:
                this.onSeek(event);
                break;
            case EventType.REQUEST_VOLUME_CHANGE:
                this.onSetVolume(event);
                break;
            case EventType.REQUEST_EDIT_TRACKS_INFO:
                this.onEditTracksInfo(event);
                break;
            case EventType.REQUEST_QUEUE_INSERT:
                this.onQueueInsert(event);
                break;
            case EventType.REQUEST_QUEUE_UPDATE:
                this.onQueueUpdate(event);
                break;
            case EventType.REQUEST_QUEUE_REMOVE:
                this.onQueueRemove(event);
                break;
            case EventType.REQUEST_QUEUE_REORDER:
                this.onQueueReorder(event);
                break;
            case EventType.PLAYER_PRELOADING:
                this.onPreload(event);
                break;
            case EventType.PLAYER_PRELOADING_CANCELLED:
                this.onCancelPreload(event);
                break;
            default:
                // Invalid command.
                this.sendError(ErrorType.INVALID_REQUEST,
                    ErrorReason.INVALID_COMMAND, event);
                console.warn('Received invalid command ' + event.type);
        }
    }

    /*
     * Event Handlers.
     */

    onLoad(event) {
        // TODO: Handle load requests where the actual media
        // doesn't change, but only it's metadata, for example
        // images. Currently we don't handle these well, but we
        if (this.isLoading) {
            // Send load cancelled.
            this.sendErrorLoadCancelled(event);
        }
        this.createMediaSession();
        this.loadItem(this.playerManager.getMediaInformation()).then(() => {
            this.isLoading = false;
            this.sendStatus(event.senderId, event.data ? event.data.requestId : null);
        }, (error) => {
            this.currentRequestId = event.data ? event.data.requestId : null;
            this.handleSetupError(error);
        });
        this.events.publish(Events.QUEUE_LOAD, {
            items: [event.data]
        });
    }

    onStop(event) {
        if (this.playerInstance) {
            this.playerInstance.stop();
            this.mediaStatus.idleReason = IdleReason.CANCELLED;
            this.broadcastStatus();
        } else {
            this.sendErrorInvalidPlayerState(event);
        }
    }

    onPause(event) {
        if (this.playerInstance) {
            this.playerInstance.pause(true);
            if (this.mediaStatus.breakStatus) {
                // TODO: improve / get rid of this
                // Force player state to playing.
                this.mediaStatus.playerState = PlayerState.PAUSED;
                this.broadcastStatus();
            }
        } else {
            this.sendErrorInvalidPlayerState(event);
        }
    }

    onPlay(event) {
        if (this.playerInstance) {
            this.playerInstance.play(true);
            if (this.mediaStatus.breakStatus) {
                // TODO: improve / get rid of this
                // Force player state to playing.
                this.mediaStatus.playerState = PlayerState.PLAYING;
                this.broadcastStatus();
            }
        } else {
            this.sendErrorInvalidPlayerState(event);
        }
    }

    onSeek(event) {
        if (this.playerInstance) {
            if (event.data.currentTime >= 0) {
                this.playerInstance.seek(event.data.currentTime);
                this.playerInstance.on('seeked', () => {
                    // Ensure that we broadcast a status update with the requestId
                    // for the SEEK event, so that senders can properly corellate
                    // requests and responses.
                    this.broadcastStatus(event.data.requestId);
                });
            }
            if (event.data.resumeState) {
                this.playerInstance.play(event.data.resumeState == SeekResumeState.PLAYBACK_START);
            }
        } else {
            this.sendErrorInvalidPlayerState(event);
        }
    }

    onSetVolume(event) {
        // TODO: When does this ever get called?
        // It appears that default senders only change the System volume level.
        if (this.playerInstance) {
            this.mediaStatus.volume = {
                level: event.data.level,
                mute: event.data.mute
            };
            this.playerInstance.setVolume(event.data.level * 100);
            this.playerInstance.setMute(event.data.mute);
            this.broadcastStatus();
        } else {
            this.sendErrorInvalidPlayerState(event);
        }
    }

    onGetStatus(event) {
        // TODO: NO_METADATA and NO_QUEUE_ITEMS flags support.
        this.sendStatus(event.senderId, event.data ? event.data.requestId : null);
    }

    onEditTracksInfo(event) {
        if (event.data.textTrackStyle) {
            // TODO: set textTrackStyle
            // let textTrackStyle = event.data.textTrackStyle;
            // See: https://developers.google.com/cast/docs/reference/receiver/cast.receiver.media.TextTrackStyle
            // playerInstance.setCaptions({
            //   color: '',
            //   fontSize: 0,
            //   fontFamily: '',
            //   fontOpacity: 0,
            //   backgroundColor: '',
            //   backgroundOpacity: 0,
            //   edgeStyle: '', // none || dropshadow || raised || depressed || uniform
            //   windowColor: '',
            //   windowOpacity: 0
            // });
        }

        let activeTrackIds = event.data.activeTrackIds;
        if (activeTrackIds) {
            // Whether we should disable the caption track.
            let disableCaptions = true;

            activeTrackIds.forEach(trackId => {
                let track = this.getTrackById(trackId);
                if (track) {
                    if (track.type == TrackType.TEXT) {
                        let playerTracks = this.playerInstance.getCaptionsList();
                        playerTracks.some((playerTrack, index) => {
                            if (playerTrack.id == track.trackContentId) {
                                disableCaptions = false;
                                if (this.playerInstance && this.playerInstance.getCurrentCaptions() != index) {
                                    this.playerInstance.setCurrentCaptions(index);
                                }
                                return true;
                            }
                        });
                    } else if (track.type == TrackType.AUDIO) {
                    // trackContentId for audio tracks match jwplayer.js's trackIndex.
                        this.playerInstance.setCurrentAudioTrack(track.trackContentId);
                    } else if (track.type == TrackType.VIDEO) {
                    // TODO
                    }
                } else {
                // err: track not found?
                // TODO: send err invalid request?
                }
            });

            // Disable caption tracks if no active tracks
            // have been supplied.
            if (disableCaptions && this.playerInstance) {
                this.playerInstance.setCurrentCaptions(TRACK_DISABLED);
            }
        }

        this.broadcastStatus();
    }

    onQueueLoad(event) {
        if (this.isLoading) {
            // Send load cancelled.
            this.sendErrorLoadCancelled(event);
        }
        // Create a new MediaSession.
        this.createMediaSession();
        event.data.items.forEach((item, index) => {
            item.itemId = ++index;
        });

        // Associate it with a queue.
        this.mediaStatus.items = event.data.items;
        this.mediaStatus.repeatMode = event.data.repeatMode;

        let mediaItem = this.mediaStatus.items[event.data.startIndex];
        // Load the first item.
        this.loadItem(mediaItem)
            .then(() => {
                this.isLoading = false;
                this.sendStatus(event.senderId, event.data.requestId);
            }, (error) => {
                this.currentRequestId = event.data.requestId;
                this.handleSetupError(error);
            });

        this.events.publish(Events.QUEUE_LOAD, {
            items: this.mediaStatus.items,
            repeatMode: this.mediaStatus.repeatMode
        });

        // Update receivers with the new queue.
        // mediaStatusFlags.push(MediaStatusFlags.QUEUE);
    }

    onQueueInsert(event) {
        // Find the highest itemId in mediaStatus.items
        let id = 1;
        this.mediaStatus.items.forEach((item) => {
            if (item.itemId >= id) {
                id = item.itemId + 1;
            }
        });

        // Start numbering from that id.
        event.data.items.forEach((item) => {
            item.itemId = id++;
        });

        // Check whether items should be added at the end of the queue.
        if (!event.data.insertBefore) {
            // Append the new items to the queue.
            this.mediaStatus.items = this.mediaStatus.items.concat(event.data.items);
        } else {
            // Figure out where we need to insert something.
            let insertBeforeIndex = this.findIndexOfItem(event.data.insertBefore);
            // Insert the elements at the correct index using a nifty trick
            // in order to prevent an extra array loop.
            Array.prototype.splice.apply(this.mediaStatus.items, [insertBeforeIndex, 0].concat(event.data.items));
        }

        // Check if we need to load a new item.
        let nextItem;
        if (event.data.currentItemIndex !== undefined) {
            nextItem = this.mediaStatus.items[event.data.currentItemIndex];
        } else if (event.data.currentItem && event.data.currentItem != this.mediaStatus.currentItem) {
            nextItem = this.mediaStatus.items[this.findIndexOfItem(event.data.currentItem)];
        }

        if (nextItem) {
            // Yes, load a new item.
            nextItem.startTimeOverride = event.data.currentTime;
            this.loadItem(nextItem).catch(this.handleSetupError);
        } else {
            // Loading not needed.
            this.broadcastStatus();
        }

        this.events.publish(Events.QUEUE_UPDATE, {
            items: this.mediaStatus.items
        });
    }

    onQueueUpdate(event) {
        if (event.data.currentItemId) {
            let nextItem = this.mediaStatus.items[this.findIndexOfItem(event.data.currentItemId)];
            nextItem.startTimeOverride = event.data.currentTime;
            this.loadItem(nextItem).catch(this.handleSetupError);
        } else if (event.data.jump) {
            let newIndex = this.getCurrentQueueIndex() + event.data.jump;
            // Check if newIndex needs to wrap around the queue boundaries.
            if (newIndex >= this.mediaStatus.items.length) {
                newIndex -= this.mediaStatus.items.length;
            }
            if (newIndex < 0) {
                newIndex += this.mediaStatus.items.length;
            }
            let nextItem = this.mediaStatus.items[this.getCurrentQueueIndex() + event.data.jump];
            // Override the startTime, if necessary.
            nextItem.startTimeOverride = event.data.currentTime;
            this.loadItem(nextItem).catch(this.handleSetupError);
        }
        // Check whether repeatMode requires updating.
        if (event.data.repeatMode) {
            this.mediaStatus.repeatMode = event.data.repeatMode;
        }
    }

    onQueueRemove(event) {
        if (!event.data.itemIds || event.data.itemIds.length == 0) {
            // err: invalid args
            this.sendErrorInvalidRequest(event, ErrorReason.INVALID_COMMAND);
            return;
        }
        if (this.mediaStatus.items.length == 0) {
            this.sendErrorInvalidPlayerState(event);
            return;
        }
        event.data.itemIds.forEach((id) => {
            let idx = this.findIndexOfItem(id);
            this.mediaStatus.items.splice(idx, 1);
        });
        if (event.data.currentItemId && event.data.currentItemId != this.mediaStatus.currentItemId) {
            let nextItem = this.mediaStatus.items[findIndexOfItem(event.data.currentItemId)];
            nextItem.startTimeOverride = event.data.currentTime;
            this.loadItem(nextItem).catch(this.handleSetupError);
        } else if (this.getCurrentQueueIndex() === -1) {
                // Current queue item has been removed to, stop playback.
            if (this.playerInstance) {
                this.playerInstance.stop();
            } /* else { // err: invalid command ? } */
        } else {
                // Broadcast the new status, because we're not stopping or loading
                // (which will implicitly trigger a broadcast).
            this.broadcastStatus();
        }
    }

    onQueueReorder(event) {
        let itemIds = event.data.itemIds;
        if (!itemIds) {
            this.sendErrorInvalidRequest(event, ErrorReason.INVALID_COMMAND);
            return;
        }

        if (event.data.insertBefore) {
            // Find the index of the queue item we want to insert before.
            let insertBeforeIndex = this.findIndexOfItem(event.data.insertBefore);

            if (!insertBeforeIndex) {
                // err: could not find item to insert before.
                this.sendErrorInvalidRequest(event, ErrorReason.INVALID_COMMAND);
                return;
            }

            // insertBefore is specified, and we have found the item to insert before,
            // re-order in the following fashion:
            //
            // If insertBefore is “A”
            // Existing queue: “A”,”D”,”G”,”H”,”B”
            // itemIds: “D”,”H”,”B”
            // New Order: “D”,”H”,”B”,“A”,”G”,”E”
            for (let i = insertBeforeIndex; itemIds.length > 0; i++) {
                // Get the mediaItem to reorder from the queue.
                let itemToMove = this.mediaStatus.items.splice(this.findIndexOfItem(itemIds.shift()), 1)[0]; // TODO: check for index not being out of bounds
                // Insert the item at the new index.
                this.mediaStatus.items.splice(i - 1, 0, itemToMove);
            }
        } else {
            // insertBefore is not specificied, re-order in the following fashion:
            // Existing queue: “A”,”D”,”G”,”H”,”B”,”E”
            // itemIds: “D”,”H”,”B”
            // New Order: “A”,”G”,”E”,“D”,”H”,”B”
            while (itemIds.length) {
                let itemToMove = this.mediaStatus.items.splice(this.findIndexOfItem(itemIds.shift()), 1)[0];
                this.mediaStatus.items.push(itemToMove);
            }
        }

        // Update the senders with the new queue.
        this.broadcastStatus();
    }

    onPreload(event) {
        // Not supported currently.
        // We might be able to support this by
        // creating multiple player instances.
        this.sendError(ErrorType.INVALID_REQUEST,
            ErrorReason.INVALID_COMMAND, event);
    }

    onCancelPreload(event) {
        // Not supported currently.
        this.sendError(ErrorType.INVALID_REQUEST,
            ErrorReason.INVALID_COMMAND, event);
    }

    /*
     * JW Player event handlers.
     * These are prefixed with 'handle' in order to distuingish them from
     * Chromecast events.
     */

    handleComplete() {
        this.events.publish(Events.MEDIA_COMPLETE, {
            item: this.mediaStatus.media
        });
        this.loadNextMediaItem();
    }

    /**
     * Handler for JW Player setupErrors.
     * @param  {Object} setupError The setupError to handle.
     */
    handleSetupError(setupError) {
        console.error('Failed to initialize player: %O', setupError);
        this.broadcastMessage({
            type: ErrorType.LOAD_FAILED,
            requestId: this.currentRequestId ? this.currentRequestId : 0
        });
        this.currentRequestId = 0;
        this.mediaStatus.playerState = PlayerState.IDLE;
        this.mediaStatus.idleReason = IdleReason.ERROR;
        this.broadcastStatus();
    }

    /**
     * Handler for JW Player mediaErrors.
     */
    handleMediaError(error) {
        let nextItem = this.getNextItemInQueue();
        let willAdvance = nextItem || this.mediaStatus.repeatMode == RepeatMode.REPEAT_ALL_AND_SHUFFLE
            && this.mediaStatus.items && this.mediaStatus.items.length > 2;

        this.events.publish(Events.MEDIA_ERROR, {
            error: error,
            currentItem: this.mediaStatus.media,
            nextItem: nextItem,
            willAdvance: willAdvance,
            timeout: ERROR_TIMEOUT
        });

        if (nextItem || willAdvance) {
            // Try to play the next item.
            window.setTimeout(() => {
                this.loadNextMediaItem();
            }, ERROR_TIMEOUT);
        }
    }

    /**
     * Handler for JW Player on('time') updates.
     */
    handleTime(event) {
        // Update the UI
        this.events.publish(Events.MEDIA_TIME, {
            currentTime: event.position,
            duration: event.duration
        });
        if (this.mediaStatus) {
            this.mediaStatus.currentTime = event.position;

            let broadcastStatusUpdate = false;
            if (this.mediaStatus.media.duration != event.duration) {
                // Check if we need to broadcast a status
                // update for a playing event, if this is
                // the first time we figure out a duration.
                broadcastStatusUpdate = true;
                let media = this.mediaStatus.media;
                media.duration = event.duration;

                // Update mediaStatus.breaks with breaks that require
                // the duration to be known (e.g. postrolls & ads with a percentual offset).
                if (media.customData && media.customData.advertising
                    && media.customData.advertising.schedule) {
                    let adBreaks = this.mediaStatus.media.breaks || [];
                    let adSchedule = media.customData.advertising.schedule;
                    Object.keys(adSchedule).forEach(breakId => {
                        let adBreak = adSchedule[breakId];
                        if (adBreak.offset.indexOf('%') !== -1
                        && adBreak.offset !== 'post') {
                            return;
                        }
                        let adPosition = adBreak.offset === 'post' ?
                        media.duration : this.offsetTime(adBreak.offset, media.duration);
                        adBreaks.push(new AdBreakInfo(breakId, adPosition));
                    });
                    this.mediaStatus.media.breaks = adBreaks;
                }
            }
            // TODO: live stream support - chromecast does not
            // expect jwplayer's definition of position for the
            // currentTime of live streams.
            if (broadcastStatusUpdate) {
                this.broadcastStatus();
            }
        }
    }

    /**
     * Handler for JW Player on('captionList') events.
     */
    handleCaptions(captionListEvent) {
        let tracksChanged = false;
        this.mediaStatus.media.tracks = this.mediaStatus.media.tracks || [];

        // Update mediaStatus.media.tracks/activeTrackIds and send status if applicable.
        captionListEvent.tracks.forEach((captionTrack, trackIndex) => {
            if (trackIndex == 0) {
            // trackIndex 0 is always off.
                return;
            }

            let newTrack = this.mediaStatus.media.tracks.length == 0
            || !this.mediaStatus.media.tracks.some(track => track.type == TrackType.TEXT
            && track.trackContentId == captionTrack.id);

            if (newTrack) {
            // Build a new cast.receiver.media.Track object, add it to mediaStatus.media.tracks.
                this.mediaStatus.media.tracks.push({
                    name: captionTrack.label,
                    trackContentId: captionTrack.id,
                    trackId: this.generateTrackId(),
                    type: TrackType.TEXT,
                    subtype: TextTrackType.CAPTIONS // TODO: distinguish between CC and SUBTITLES
                });
                tracksChanged = true;
            }
        });

        if (captionListEvent.track == 0 && !tracksChanged) {
            // If the caption track is disabled, make sure
            // that we update the array of activeTrackIds.
            tracksChanged = this.updateActiveTracks();
        }

        if (tracksChanged) {
            this.broadcastStatus();
        }
    }

    /**
     * Handler for JW Player on('audioTrack') events.
     */
    handleAudioTracks(event) {
        let tracksChanged = false;
        this.mediaStatus.media.tracks = this.mediaStatus.media.tracks || [];

        event.tracks.forEach((audioTrack, index) => {
            let newTrack = this.mediaStatus.media.tracks.length == 0
                || !this.mediaStatus.media.tracks.some(track => track.type == TrackType.AUDIO
                && track.trackContentId == index);

            if (newTrack) {
                this.mediaStatus.media.tracks.push({
                    name: audioTrack.name,
                    trackContentId: index,
                    type: TrackType.AUDIO,
                    trackId: this.generateTrackId()
                });
                tracksChanged = true;
            }
        });

        if (tracksChanged) {
            this.updateActiveTracks();
            this.broadcastStatus();
        }
    }

    /**
     * Handler for the JW Player on('adImpression') events.
     * Used for IMA only.
     */
    handleAdImpression(event) {
        let ima = event.ima;
        if (!ima) {
            return;
        }

        // Since IMA does not expose the on('adMeta') event,
        // we'll build an adMeta object and then trigger the adMeta handler.
        let adMeta = new AdMeta();

        // Copy the keys that are in both adMeta and event
        // to adMeta.
        Object.keys(adMeta).forEach(key => {
            if (event[key] !== undefined) {
                adMeta[key] = event[key];
            }
        });
        adMeta.title = event.adtitle;

        let ad = ima.ad;

        // Find the clickThroughUrl using this 'hack' in the ad object.
        Object.keys(ad).some(key => {
            if (ad[key].clickThroughUrl !== undefined) {
                adMeta.clickthrough = ad[key].clickThroughUrl;
                return true;
            }
        });

        let adPodInfo = ad.getAdPodInfo();
        if (adPodInfo) {
            adMeta.sequence = adPodInfo.getAdPosition();
            adMeta.podcount = adPodInfo.getTotalAds();
        }

        let adSelectionSettings = new google.ima.CompanionAdSelectionSettings();
        adSelectionSettings.sizeCriteria = google.ima.CompanionAdSelectionSettings.SizeCriteria.IGNORE;
        adMeta.companions = AdCompanion.convertImaCompanions(ad.getCompanionAds(300, 250, adSelectionSettings));

        // Forward the meta object to the adMeta handler.
        this.handleAdMeta(adMeta);
    }

    /**
     * Handler for JW Player on('adMeta') events.
     */
    handleAdMeta(event) {
        this.events.publish(Events.AD_IMPRESSION, {
            meta: event
        });
        let customData = this.mediaStatus.customData;
        customData.adMeta = event;
        // Force playerState to playing.
        this.mediaStatus.playerState = PlayerState.PLAYING;

        if (!event.sequence || event.sequence == 1) {
            // This is the first ad in a pod.
            this.adPodStartTime = Date.now();
        }

        // Populate mediaStatus.media.breaks and mediaStatus.media.breakClips.
        let adSchedule = this.playerInstance.getPlaylist()[this.playerInstance.getPlaylistIndex()].adschedule;
        if (adSchedule) {
            let breaks = this.mediaStatus.media.breaks;
            if (!breaks) {
                // We are dealing with a preroll, the duration of the media is unknown
                // and because of that the breaks have not yet been initialized.
                // We initialize an array of breaks, but we do not add the breaks
                // that require the duration to be known.
                breaks = [];
                let schedule = this.mediaStatus.media.customData.advertising.schedule;
                Object.keys(schedule).forEach(breakId => {
                    let adBreak = schedule[breakId];
                    if (adBreak.offset.indexOf('%') != -1
                    || adBreak.offset === 'post') {
                        return;
                    }

                    let breakPosition;
                    if (adBreak.offset == 'pre') {
                        breakPosition = 0;
                    } else {
                        breakPosition = adBreak.offset.indexOf(':') != -1 ?
                        jwplayer.utils.seconds(adBreak.offset) : Number.parseFloat(adBreak.offset);
                    }
                    breaks.push(new AdBreakInfo(breakId, breakPosition));
                    this.mediaStatus.media.breaks = breaks;
                });
            }

            let breakClips = this.mediaStatus.media.breakClips || [];

            // First find the "id" of the current ad break.
            let currentBreakId = null;
            Object.keys(adSchedule).some(breakId => {
                if (adSchedule[breakId].tag == event.tag) {
                    currentBreakId = breakId;
                    return true;
                }
            });

            // Next find the break by "id" in the current "breaks" array.
            let currentBreak = null;
            breaks.some((adBreak) => {
                if (adBreak.id == currentBreakId) {
                    currentBreak = adBreak;
                    return true;
                }
            });

            // Okay, now we should have all the ingredients to build
            // an adBreakClipInfo which we can associate to a "break".
            let adBreakClipInfo = new AdBreakClipInfo(event.id);
            adBreakClipInfo.clickThroughUrl = event.clickthrough;
            adBreakClipInfo.title = event.title;
            adBreakClipInfo.mimeType = event.creativetype;

            // Update the media status.
            breakClips.push(adBreakClipInfo);
            this.mediaStatus.media.breakClips = breakClips;

            let breakClipIds = currentBreak.breakClipIds || [];
            breakClipIds.push(adBreakClipInfo.id);
            currentBreak.breakClipIds = breakClipIds;

            // Now update the breakStatus
            let adBreakStatus = new AdBreakStatus(0.0, 0.0);
            adBreakStatus.breakId = currentBreakId;
            adBreakStatus.breakClipId = adBreakClipInfo.id;
            adBreakStatus.whenSkippable = event.skipoffset ? event.skipoffset : -1;
            this.mediaStatus.breakStatus = adBreakStatus;
        }

        this.broadcastStatus();
    }

    /**
     * Handler for the JW Player on('adTime') event.
     */
    handleAdTime(event) {
        this.events.publish(Events.AD_TIME, event);
        if (this.mediaStatus.breakStatus) {
            let adBreakStatus = this.mediaStatus.breakStatus;
            adBreakStatus.currentBreakClipTime = event.position;
            adBreakStatus.currentBreakTime = (Date.now() - this.adPodStartTime) / 1000;

            // Update the ad duration.
            // TODO: prevent look-up of the adBreak in mediaStatus.media.breaks for
            // every time update?
            this.mediaStatus.media.breakClips.some(breakClip => {
                if (breakClip.id === adBreakStatus.breakClipId) {
                    breakClip.duration = event.duration;
                    return true;
                }
            });
            // TODO: update duration of the current ad break?
        }
    }

    /**
     * Handler for the JW Player on('adComplete') event.
     */
    handleAdComplete(event) {
        this.events.publish(Events.AD_COMPLETE, event);
        let customData = this.mediaStatus.customData;
        delete customData.adMeta;

        // Update the isWatched property if necessary.
        this.mediaStatus.media.breaks.some(adBreak => {
            if (adBreak.breakClipIds
        && adBreak.breakClipIds.indexOf(event.id) != -1) {
                adBreak.isWatched = true;
                return true;
            }
        });

        delete this.mediaStatus.breakStatus;
        this.broadcastStatus();
    }

    /*
     * Utility functions.
     */

    /**
     * Loads an item on JW Player.
     * @param {MediaInfo} the item to load, this can be a MediaQueue item, or a media item.
     */
    loadItem(item) {
        return new Promise((resolve, reject) => {
            // Broadcast a MEDIA_LOAD event.
            this.events.publish(Events.MEDIA_LOAD, {
                item: item
            });

            if (!this.playerInstance) {
                this.playerInstance = jwplayer(this.container);
            }

            let media = item.media ? item.media : item;
            let playlist = this.mediaToPlaylist(media);
            let playerConfig = {
                primary: 'html5',
                width: '100%',
                height: '100%',
                playlist: playlist,
                hlshtml: true,
                autostart: item.autoplay ? item.autoplay : true,
                controls: false,
                analytics: this.analyticsConfig,
            };

            let customMediaData = media.customData || {};

            if (customMediaData.advertising && customMediaData.advertising.client) {
                playerConfig.advertising = {
                    client: customMediaData.advertising.client
                };
            }
            if (customMediaData.drm) {
                playerConfig.drm = customMediaData.drm;
            }

            // TODO: set textTrackStyle.
            // if (playerInstance.getConfig()) {
            //   playerInstance.stop();
            // }
            this.playerInstance.setup(playerConfig);

            this.mediaStatus.currentTime = 0;
            if ((item.startTimeOverride || item.startTime) && item.streamType != 'LIVE') {
                // TODO: Check for live.
                let startTime = item.startTimeOverride ? item.startTimeOverride : item.startTime;

                this.mediaStatus.currentTime = startTime;
                this.playerInstance.once('ready', function() {
                    if (this.playerInstance) {
                        this.playerInstance.seek(startTime);
                    }
                });

                // The startTime can only be overridden once.
                delete item.startTimeOverride;
            }

            this.mediaStatus.playerState = (item.autoplay || item.autoplay === undefined)
            ? PlayerState.BUFFERING : PlayerState.PAUSED;
            this.mediaStatus.media = media;
            this.mediaStatus.activeTrackIds = [];
            // TODO:
            // Chrome senders might have issues if they receive a status
            // update with a media.duration of 0 when the player state is set to
            // playing.
            this.mediaStatus.media.duration = this.mediaStatus.media.duration || 0;

            // Ensure new media metadata gets pushed to
            // the senders.
            // mediaStatusFlags.push(MediaStatusFlags.META);

            // Update the currentItemId.
            if (item.itemId) {
                this.mediaStatus.currentItemId = item.itemId;
            } else {
                delete this.mediaStatus.currentItemId;
            }

            this.registerPlayerStateListeners();

            this.playerInstance.once('setupError', reject);
            this.playerInstance.once('error', reject);
            if (this.mediaStatus.media.duration) {
                // Update ad break info before resolving.
                this.initAdBreakInfo(media);
            }

            let hasPreRoll = this.mediaStatus.media.breaks
            && this.mediaStatus.media.breaks.some(adBreak => {
                return adBreak.position === 0;
            });

            if (hasPreRoll && !this.mediaStatus.media.duration) {
                // It is impossible to determine the duration
                // before playback.
                resolve();
            } else {
                // Listen for the 'meta' event in order the duration
                // before playback begins.
                const onDuration = event => {
                    if (event.duration >= 0) {
                        this.playerInstance.off('meta time', onDuration);
                        this.mediaStatus.media.duration = event.duration;
                        resolve();
                    }
                };
                this.playerInstance.on('meta time', onDuration);
            }
        });
    }

    loadNextMediaItem() {
        let index;
        let n;
        let temp;
        let i;

        if (this.mediaStatus) {
            switch (this.mediaStatus.repeatMode) {
                case RepeatMode.REPEAT_OFF:
                    // Remove the current item from mediaSession/queue.
                    // Load next item on player and play.
                    if (this.mediaStatus.items) {
                        // Pop the current item of the queue.
                        this.mediaStatus.items.shift();
                        // If there is a next item in the queue, play it.
                        if (this.mediaStatus.items.length != 0) {
                            this.loadItem(mediaStatus.items[0]).catch(this.handleSetupError);
                        } else {
                            this.mediaStatus.idleReason = IdleReason.FINISHED;
                        }
                        // Make sure to push the updated queue to connected
                        // senders.
                        // mediaStatusFlags.push(MediaStatusFlags.QUEUE);
                    }
                    break;
                case RepeatMode.REPEAT_ALL:
                    index = this.getCurrentQueueIndex();
                    if (index) {
                        if (index < this.mediaStatus.items.length - 1) {
                            // Play the next item.
                            this.loadItem(this.mediaStatus.items[index++]).catch(this.handleSetupError);
                        } else {
                            // Recycle through the queue.
                            this.loadItem(this.mediaStatus.items[0]).catch(this.handleSetupError);
                        }
                    }
                    break;
                case RepeatMode.REPEAT_SINGLE:
                    // Seek to the beginning.
                    this.playerInstance.seek(0);
                    // Restart playback.
                    this.playerInstance.play(true);
                    break;
                case RepeatMode.REPEAT_ALL_AND_SHUFFLE:
                    index = this.getCurrentQueueIndex();
                    if (index) {
                        if (index < this.mediaStatus.items.length - 1) {
                            this.loadItem(this.mediaStatus.items[index++]).catch(this.handleSetupError);
                        } else {
                            // Shuffle time!
                            n = this.mediaStatus.items.length;

                            // Shuffle the queue using Fisher-Yates (O(n)):
                            while (n) {
                                // Pick a remaining element.
                                i = Math.floor(Math.random() * n--);

                                // Swap it with the current element.
                                temp = this.mediaStatus.items[n];
                                this.mediaStatus.items[n] = this.mediaStatus.items[i];
                                this.mediaStatus.items[i] = temp;
                            }

                            // Play the first item.
                            this.loadItem(this.mediaStatus.items[0]).catch(this.handleSetupError);

                            // Make sure to push the updated queue to connected
                            // senders.
                            // mediaStatusFlags.push(MediaStatusFlags.QUEUE);
                        }
                    }
                    break;
                default:
                    // Do nothing.
                    break;
            }
        }
    }

    updatePlayerState(newState, adPlaying) {
        if (this.mediaStatus) {
            let newPlayerState;
            switch (newState) {
                case 'buffer':
                    newPlayerState = PlayerState.BUFFERING;
                    break;
                case 'idle':
                    newPlayerState = PlayerState.IDLE;
                    break;
                case 'pause':
                    newPlayerState = PlayerState.PAUSED;
                    break;
                case 'play':
                    newPlayerState = PlayerState.PLAYING;
                    break;
                default:
                    break;
            }
            let oldState = this.mediaStatus.playerState;
            this.mediaStatus.playerState = newPlayerState;
            if (!adPlaying) {
                this.events.publish(Events.STATE_CHANGE, {
                    oldState: oldState,
                    newState: this.mediaStatus.playerState
                });
            }
            this.broadcastStatus();
        }
    }

    registerPlayerStateListeners() {
        this.playerInstance.on('buffer', () => {
            this.updatePlayerState('buffer', false);
        });
        this.playerInstance.on('idle', () => {
            this.updatePlayerState('idle', false);
        });
        this.playerInstance.on('pause', () => {
            this.updatePlayerState('pause', false);
        });
        this.playerInstance.on('play', () => {
            this.updatePlayerState('play', false);
        });
        this.playerInstance.on('time', this.handleTime.bind(this));
        this.playerInstance.on('error', this.handleMediaError.bind(this));
        this.playerInstance.on('mediaError', this.handleMediaError.bind(this));
        this.playerInstance.on('complete', this.handleComplete.bind(this));
        this.playerInstance.on('captionsList', this.handleCaptions.bind(this));
        this.playerInstance.on('audioTracks', this.handleAudioTracks.bind(this));
        this.playerInstance.on('playlistItem', (playlistItem) => {
            this.events.publish(Events.MEDIA_LOADED, {
                media: this.mediaStatus.media,
                playlistItem: playlistItem
            });
        });
        this.playerInstance.on('seek', event => this.events.publish(Events.MEDIA_SEEK, event));
        this.playerInstance.on('seeked', () => {
            this.events.publish(Events.MEDIA_SEEKED, {});
        });
        // googima doesn't fire adMeta events, thus we use the adImpression event
        // to trigger the handler.
        if (this.mediaStatus.media.customData
            && this.mediaStatus.media.customData.advertising) {
            let advertising = this.mediaStatus.media.customData.advertising;
            if (advertising.client === 'vast') {
                this.playerInstance.on('adMeta', this.handleAdMeta);
            } else if (advertising.client === 'googima') {
                this.playerInstance.on('adImpression', this.handleAdImpression);
            }
        }
        this.playerInstance.on('adPlay', event => {
            this.updatePlayerState('play', true);
            this.events.publish(Events.AD_PLAY, event);
        });
        this.playerInstance.on('adPause', event => {
            this.updatePlayerState('pause', true);
            this.events.publish(Events.AD_PAUSE, event);
        });
        this.playerInstance.on('adComplete', this.handleAdComplete);
        this.playerInstance.on('adError', event => {
            console.error('AdError: %O', event);
            this.events.publish(Events.AD_ERROR, event);
            delete this.mediaStatus.customData.adMeta;
            delete this.mediaStatus.breakStatus;
            this.broadcastStatus();
        });
        this.playerInstance.on('adTime', this.handleAdTime);
    }

    removeStateListeners() {
        this.playerInstance.off('buffer');
        this.playerInstance.off('idle');
        this.playerInstance.off('pause');
        this.playerInstance.off('play');
        this.playerInstance.off('time');
        this.playerInstance.off('error');
        this.playerInstance.off('mediaError');
        this.playerInstance.off('complete');
        this.playerInstance.off('captionsList');
        this.playerInstance.off('audioTracks');
        this.playerInstance.off('adMeta');
        this.playerInstance.off('adComplete');
        this.playerInstance.off('adError');
        this.playerInstance.off('adImpression');
    }

    serializeStatus(requestId) {
        this.updateActiveTracks();

        let statusCopy;
        if (this.mediaStatus) {
            statusCopy = Object.assign({}, this.mediaStatus);

            // Delete properties we don't want to send.
            // for (let flag in MediaStatusFlags) {
            //   if (MediaStatusFlags.hasOwnProperty(flag)
            //     && mediaStatusFlags.indexOf(flag) < 0) {
            //     delete statusCopy[MediaStatusFlags[flag]];
            //     mediaStatusFlags.splice(mediaStatusFlags.indexOf(flag), 1);
            //   }
            // }

            if (!statusCopy.activeTrackIds) {
                delete statusCopy.activeTrackIds;
            }
        }

        let status = {
            type: MessageType.MEDIA_STATUS,
            requestId: requestId ? requestId : this.currentRequestId,
            status: statusCopy ? [statusCopy] : []
        };
        // Always reset the requestId after a message has been sent with it.
        this.currentRequestId = 0;
        return status;
    }

    broadcastStatus(requestId) {
        if (this.isLoading) {
            return;
        }
        this.broadcastMessage(this.serializeStatus(requestId));
    }

    sendStatus(senderId, requestId) {
        if (this.isLoading) {
            return;
        }
        let status = this.serializeStatus(requestId);
        this.sendMessage(senderId, status);
    }

    sendErrorInvalidRequest(event, reason) {
        this.sendError(ErrorType.INVALID_REQUEST, reason, event);
    }

    sendErrorInvalidPlayerState(event) {
        this.broadcastMessage({
            requestId: event.data && event.data.requestId ? event.data.requestId : 0,
            type: ErrorType.INVALID_PLAYER_STATE,
        });
    }

    sendErrorLoadCancelled(event) {
        this.broadcastMessage({
            requestId: event.data && event.data.requestId ? event.data.requestId : 0,
            type: ErrorType.LOAD_CANCELLED
        });
    }

    sendError(messageType, reason, event) {
        this.broadcastMessage({
            requestId: event.data && event.data.requestId ? event.data.requestId : 0,
            type: messageType,
            reason: reason
        });
    }

    /**
     * Creates a new mediaSession, destroying an existing one if it exists.
     */
    createMediaSession() {
        if (this.playerInstance) {
            this.playerInstance.stop();
            this.removeStateListeners();
        }

        let mediaSessionId = this.mediaStatus ? this.mediaStatus.mediaSessionId += 1 : 1;
        this.mediaStatus = new cast.framework.messages.MediaStatus();
        this.mediaStatus.activeTrackIds = [];
        this.mediaStatus.supportedMediaCommands = SUPPORTED_FEATURES;
        this.mediaStatus.mediaSessionId = mediaSessionId;
        this.mediaStatus.customData = {};
    }

    getCurrentQueueIndex() {
        if (this.mediaStatus) {
            return this.findIndexOfItem(this.mediaStatus.currentItemId);
        }
    }

    findIndexOfItem(itemId) {
        let itemIndex = -1;
        if (!itemId || !mediaStatus.items
            || this.mediaStatus.items.length == 0) {
            return itemIndex;
        }

        this.mediaStatus.items.some((mediaItem, index) => {
            if (itemId == mediaItem.itemId) {
                itemIndex = index;
                return true;
            }
        });
        return itemIndex;
    }

    getTrackIndex(trackId) {
        let trackIndex = -1;
        if (!trackId || !this.mediaStatus.media.tracks
            || this.mediaStatus.media.tracks.length == 0) {
            return trackIndex;
        }

        this.mediaStatus.media.tracks.some((track, index) => {
            if (trackId == track.trackId) {
                trackIndex = index;
                return true;
            }
            return false;
        });
        return trackIndex;
    }

    getTrackById(trackId) {
        let trackIndex = this.getTrackIndex(trackId);
        if (trackIndex < 0) {
            return null;
        }
        return this.mediaStatus.media.tracks[trackIndex];
    }

    // Converts a Chromecast Media Object into a JW Player playlist.
    mediaToPlaylist(media) {
        let playlistItem = {
            file: media.contentId,
            tracks: []
        };
        if (media.customData) {
            let customData = media.customData;

            if (customData.mediaid) {
                playlistItem.mediaid = customData.mediaid;
            }
            if (customData.advertising && customData.advertising.schedule) {
                playlistItem.adschedule = customData.advertising.schedule;
            }
            if (customData.drm) {
                playlistItem.drm = customData.drm;
            }
        }
        if (media.tracks) {
            // Set side car caption tracks.
            media.tracks.forEach(function(track) {
                if (track.type === TrackType.TEXT
                    && track.trackContentId) {
                    // Note: JW Player textTrack!
                    let textTrack = {
                        file: track.trackContentId,
                        label: track.name
                    };
                    if (!track.subtype ||
                        track.subtype == TextTrackType.SUBTITLES
                        || track.subtype == TextTrackType.CAPTIONS) {
                        textTrack.kind = 'captions';
                    } else if (track.subtype == TextTrackType.CHAPTERS) {
                        textTrack.kind = 'chapters';
                    } else {
                        // Track is TextTrackType.METADATA, or TextTrackType.DESCRIPTIONS.
                        // Unsupported currently.
                        return;
                    }
                    playlistItem.tracks.push(textTrack);
                }
            });
        }
        return [playlistItem];
    }

    offsetTime(offset, duration) {
        if (offset.toString().slice(-1) === '%') {
            return duration * Number.parseFloat(offset.slice(0, -1)) / 100;
        }
        return Number.parseFloat(offset);
    }

    // Parses Ad Breaks from the customData section of a MediaInfo object.
    parseBreaksFromMediaInfo(media) {
        let adBreaks = [];
        if (!media.customData || !media.customData.advertising
            || !media.customData.advertising.schedule) {
            return adBreaks;
        }
        let adSchedule = media.customData.advertising.schedule;
        Object.keys(adSchedule).forEach(breakId => {
            let adBreak = adSchedule[breakId];
            let breakPosition;
            if (adBreak.offset == 'pre') {
                breakPosition = 0;
            } else if (adBreak.offset == 'post') {
                breakPosition = media.duration;
            } else {
                breakPosition = adBreak.offset.indexOf(':') != -1 ?
                jwplayer.utils.seconds(adBreak.offset) : this.offsetTime(adBreak.offset, media.duration);
            }
            adBreaks.push(new AdBreakInfo(breakId, breakPosition));
        });
        return adBreaks;
    }

    /**
     * Initializes the "breaks" property in a MediaInfo object.
     */
    initAdBreakInfo(media) {
        // Update information about adBreaks in the MediaInfo object.
        let breaks = this.parseBreaksFromMediaInfo(media);
        if (breaks.length > 0) {
            media.breaks = breaks;
        } else {
            delete media.breaks;
        }
        // Delete breakClips until we have determined them.
        delete media.breakClips;
    }

    /**
     * Generates a new unique trackId.
     */
    generateTrackId() {
        let trackId = 1;
        // Find the highest trackId in mediaStatus.media.tracks and start numbering from that.
        this.mediaStatus.media.tracks.forEach(track => {
            if (track.trackId >= trackId) {
                trackId = track.trackId++;
            }
        });
        return trackId;
    }

    /**
     * Synchronizes the activeTrackIds array in the media session with
     * what is active on the JW Player instance.
     */
    updateActiveTracks() {
        if (!this.mediaStatus) {
            // No active media session.
            return false;
        }

        let activeTrackIds = [];
        if (!this.playerInstance) {
            this.mediaStatus.activeTrackIds = activeTrackIds;
            return false;
        }

        // Caption Tracks
        let activeCaptionTrackIndex = this.playerInstance.getCurrentCaptions();
        if (activeCaptionTrackIndex > 0) {
            // Player has captions enabled.
            let activeCaptionTrack = this.playerInstance.getCaptionsList()[activeCaptionTrackIndex];
            // Find the associated track in mediaStatus.media.tracks:
            this.mediaStatus.media.tracks.some(track => {
                if (track.type == TrackType.TEXT
            && track.trackContentId == activeCaptionTrack.id) {
                    activeTrackIds.push(track.trackId);
                    return true;
                }
            });
        }

        // Audio Tracks
        let activeAudioTrack = this.playerInstance.getCurrentAudioTrack();
        // -1 = no alternative tracks
        if (activeAudioTrack >= 0) {
            this.mediaStatus.media.tracks.some(track => {
                if (track.type == TrackType.AUDIO
            && track.trackContentId == activeAudioTrack) {
                    activeTrackIds.push(track.trackId);
                    return true;
                }
            });
        }

        // TODO: Video Tracks

        // Check whether the activeTracks were updated.
        let activeTracksChanged = this.mediaStatus.activeTrackIds.length != activeTrackIds.length
            || this.mediaStatus.activeTrackIds.some(trackId => activeTrackIds.indexOf(trackId) < 0);
        // Update the media session.
        this.mediaStatus.activeTrackIds = activeTrackIds;
        return activeTracksChanged;
    }

    /**
     * Returns the next item in the queue.
     */
    getNextItemInQueue() {
        let index = -1;

        // TODO: can we get rid of the duplicated logic here?
        // maybe merge with handleComplete?
        // Is there a better way of exposing this?
        switch (this.mediaStatus.repeatMode) {
            case RepeatMode.REPEAT_OFF:
                return this.mediaStatus.items.length >= 2 ? this.mediaStatus.items[1] : null;
            case RepeatMode.REPEAT_ALL:
                index = this.getCurrentQueueIndex();
                if (index != -1) {
                    return index == this.mediaStatus.items.length - 1
                        ? this.mediaStatus.items[0] : this.mediaStatus.items[index++];
                }
                return null;
            case RepeatMode.REPEAT_SINGLE:
                return this.mediaStatus.items[this.getCurrentQueueIndex()];
            case RepeatMode.REPEAT_ALL_AND_SHUFFLE:
                index = this.getCurrentQueueIndex();
                if (index != -1) {
                    return index == this.mediaStatus.items.length - 1
                        ? null : this.mediaStatus.items[index++];
                }
                break;
            default:
                break;
        }
        return null;
    }

    getRepeatMode() {
        return this.mediaStatus.repeatMode;
    }

    addItemToQueue(mediaQueueItem) {
        this.onQueueInsert({
            data: {
                items: [mediaQueueItem]
            }
        });
    }
}

