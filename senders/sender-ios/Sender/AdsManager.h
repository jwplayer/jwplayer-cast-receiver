//
//  AdsManager.h
//  Sender
//
//  Created by Rik Heijdens on 1/24/17.
//  Copyright © 2017 JW Player. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "AdsManagerDelegate.h"

@import GoogleCast;

@interface AdsManager : NSObject<GCKRemoteMediaClientListener>

/**
 * The delegate receiving callbacks.
 */
@property (nonatomic, weak, nullable) id<AdsManagerDelegate> delegate;

@end
