//
//  AdsManager.m
//  Sender
//
//  Created by Rik Heijdens on 1/24/17.
//  Copyright © 2017 JW Player. All rights reserved.
//

#import "AdsManager.h"

@interface AdsManager()<GCKRemoteMediaClientAdInfoParserDelegate>

@end

@implementation AdsManager {
    AdMeta *_lastAdMeta;
    BOOL _adPlaying;
}

- (void)remoteMediaClient:(GCKRemoteMediaClient *)client
     didUpdateMediaStatus:(GCKMediaStatus *)mediaStatus {
    client.adInfoParserDelegate = self;
    
    // Check for Ad Meta.
    NSDictionary *customData = mediaStatus.customData;
    if (customData) {
        NSDictionary *adMetadata = [customData objectForKey:@"adMeta"];
        if (adMetadata) {
            AdMeta *meta = [[AdMeta alloc] initFromDictionary:adMetadata];
            if (![_lastAdMeta isEqual:meta]) {
                _lastAdMeta = meta;
                if ([self shouldDelegate:@selector(onAdMeta:)]) {
                    [_delegate onAdMeta:_lastAdMeta];
                }
            }
        }
    }
    
    // Check for Ad Play.
    if (mediaStatus.playingAd != _adPlaying) {
        _adPlaying = mediaStatus.playingAd;
        if (_adPlaying && [self shouldDelegate:@selector(onAdPlay)]) {
            [_delegate onAdPlay];
        } else if ([self shouldDelegate:@selector(onAdEnded)]) {
            [_delegate onAdEnded];
        }
    }
}

- (BOOL)shouldDelegate:(SEL)selector {
    return _delegate && [_delegate respondsToSelector:selector];
}

#pragma mark - AdInfoParserDelegate

- (BOOL)remoteMediaClient:(GCKRemoteMediaClient *)client
    shouldSetPlayingAdInMediaStatus:(GCKMediaStatus *)mediaStatus {
    NSLog(@"shouldSetPlayingAdInMediaStatus()");
    return mediaStatus.adBreakStatus != nil;
}

- (NSArray<GCKAdBreakInfo *> *)remoteMediaClient:(GCKRemoteMediaClient *)client
                  shouldSetAdBreaksInMediaStatus:(GCKMediaStatus *)mediaStatus {
    return mediaStatus.mediaInformation.adBreaks;
}

@end
