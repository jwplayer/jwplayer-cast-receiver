import RelatedLoader from './loader';
import * as Events from '../events';
import { REQUEST_TIMEOUT } from '../utils/http';
import { RepeatMode } from '../cast/repeatmode';
import { TrackType, TextTrackType } from '../cast/tracktype';

export default function RelatedController(config, events, mediaManager) {

    let currentMediaId;
    let feedRequested = false;

    // A blacklist of mediaids that have been played as 'recommended'
    // video in this session already.
    let blacklist = [];

    // Calculate the offset at which we need to load the related feed.
    let offset = 0;
    if (typeof (config.autoAdvanceWarningOffset) === 'number') {
        offset = config.autoAdvanceWarningOffset + REQUEST_TIMEOUT / 1000;
    }

    if (offset) {
        events.subscribe(Events.MEDIA_TIME, handleTime);
        events.subscribe(Events.MEDIA_LOADED, event => {
            feedRequested = false;
            let media = event.media;
            if (media.customData && media.customData.mediaid) {
                currentMediaId = media.customData.mediaidz;
            }
        });
    }

    function handleTime(event) {
        if (feedRequested
            || mediaManager.getRepeatMode() != RepeatMode.REPEAT_OFF
            || !currentMediaId) {
            // Don't do anything when queue repeating is configured.
            // Or if no mediaId is given.
            return;
        }

        if (event.duration - event.currentTime <= offset && !mediaManager.getNextItemInQueue()) {
            feedRequested = true;
            RelatedLoader.load(config.recommendationsPlaylist, currentMediaId).then(feed => {
                let mediaQueueItem = getMediaQueueItem(feed.playlist);
                if (mediaQueueItem) {
                    blacklist.push(mediaQueueItem.media.customData.mediaid);
                    mediaManager.addItemToQueue(mediaQueueItem);
                }
            }, error => {
                console.warn('Error loading recommendations: %O', error);
            });
        }
    }

    function getMediaQueueItem(playlist) {
        let mediaQueueItem = null;
        if (!playlist) {
            return null;
        }

        // Check whether the blacklist should be cleared.
        let clearBlacklist = !playlist.some(item => blacklist.indexOf(item.mediaid) == -1);
        if (clearBlacklist) {
            blacklist = [];
        }

        playlist.some(item => {
            let mediaInfo = new cast.receiver.media.MediaInformation();

            if (blacklist.indexOf(item.mediaid) != -1) {
            // User has already watched this video in this session.
                return;
            }

        // Find the preferred source.
            if (!item.sources) {
                return;
            }

            let preferredSource;
            item.sources.some(source => {
                if (source.type == 'application/vnd.apple.mpegurl') {
                    preferredSource = source;
                    return;
                }
            });

            if (!preferredSource) {
            // HLS not found, try to find the best MP4 rendition.
                item.sources.forEach(source => {
                    if (cast.receiver.platform.canDisplayType(source.type)) {
                        if (!preferredSource) {
                            preferredSource = source;
                        } else if (source.width > preferredSource.width) {
                            preferredSource = source;
                        }
                    }
                });
            }

            if (!preferredSource) {
            // err: no source found?
                return;
            }
            mediaInfo.contentId = preferredSource.file;

        // Add text tracks.
            if (item.tracks) {
                item.tracks.forEach((track, index) => {
                    if (track.kind === 'captions') {
                        let captionTrack = new cast.receiver.media.Track(index, TrackType.TEXT);
                        captionTrack.name = track.label;
                        captionTrack.subtype = TextTrackType.CAPTIONS;
                        captionTrack.trackContentId = track.file;
                        mediaInfo.tracks = mediaInfo.tracks || [];
                        mediaInfo.tracks.push(captionTrack);
                    }
                });
            }

            mediaInfo.streamType = cast.receiver.media.StreamType.NONE;
            mediaInfo.duration = item.duration;
            mediaInfo.customData = {
                mediaid: item.mediaid
            };

            mediaInfo.metadata = {
                metadataType: 0,
                images: item.image ? [{
                    url: item.image,
                    width: 0,
                    height: 0
                }] : [],
                title: item.title,
                subtitle: item.description
            };

            mediaQueueItem = {
                media: mediaInfo
            };

            return true;
        });

        return mediaQueueItem;
    }

}
