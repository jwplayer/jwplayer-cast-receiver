//
//  AdMeta.h
//  Sender
//
//  Created by Rik Heijdens on 1/24/17.
//  Copyright © 2017 JW Player. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "AdCompanion.h"

@interface AdMeta : NSObject

/**
 * The type of the ad, either linear or nonlinear.
 */
@property (nonatomic, readonly, nullable) NSString *adType;

/**
 * Randomly generated identifier of the ad.
 */
@property (nonatomic, readonly, nullable) NSString *adId;

/**
 * The ad tag.
 */
@property (nonatomic, readonly, nullable) NSString *tag;

/**
 * The ad client, either "vast" or "googima".
 */
@property (nonatomic, readonly, nullable) NSString *client;

/**
 * The waterfall index of the ad.
 */
@property (nonatomic, readonly) NSInteger wItem;

/**
 * The amount of waterfall ads.
 */
@property (nonatomic, readonly) NSInteger wCount;

/**
 * The index of the ad in a pod.
 */
@property (nonatomic, readonly) NSInteger sequence;

/**
 * The length of the ad pod.
 */
@property (nonatomic, readonly) NSInteger podCount;

/**
 * The creative type of the ad, can be linear or nonlinear.
 */
@property (nonatomic, readonly, nullable) NSString *creativeType;

/**
 * The skip offset of the ad.
 */
@property (nonatomic, readonly) NSInteger skipOffset;

/**
 * The skip message of the ad (default: "Skip ad in xx").
 */
@property (nonatomic, readonly, nullable) NSString *skipMessage;

/**
 * The text of the skip button of the ad (default: "Skip").
 */
@property (nonatomic, readonly, nullable) NSString *skipText;

/**
 * The ad display message (default: "This ad will end in xx seconds.").
 */
@property (nonatomic, readonly, nullable) NSString *message;

/**
 * The clickthrough url of the ad.
 */
@property (nonatomic, readonly, nullable) NSString *clickThrough;

/**
 * The title of the ad.
 */
@property (nonatomic, readonly, nullable) NSString *title;

/**
 * The companions of this ad.
 */
@property (nonatomic, readonly, nullable) NSArray<AdCompanion *> *companions;

- (instancetype _Nonnull)init NS_UNAVAILABLE;

/**
 * Initializes an AdMeta object from a dictionary.
 */
- (instancetype _Nonnull)initFromDictionary:(NSDictionary * _Nonnull)dictionary;

@end
