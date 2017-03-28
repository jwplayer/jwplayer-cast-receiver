//
//  AdsManagerDelegate.h
//  Sender
//
//  Created by Rik Heijdens on 1/24/17.
//  Copyright © 2017 JW Player. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "AdMeta.h"

@protocol AdsManagerDelegate <NSObject>

@optional

/**
 * Called when the receiver signals that ad playback begins.
 */
-(void)onAdPlay;

/**
 * Called when the receiver singals that an ad break has ended.
 */
-(void)onAdEnded;

/**
 * Called when Ad Metadata has been received from the receiver.
 * @param adMeta the metadata received.
 */
-(void)onAdMeta:(AdMeta *)adMeta;

@end
