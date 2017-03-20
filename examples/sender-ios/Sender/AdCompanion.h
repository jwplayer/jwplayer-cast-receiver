//
//  AdCompanion.h
//  Sender
//
//  Created by Rik Heijdens on 1/24/17.
//  Copyright © 2017 JW Player. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface AdCompanion : NSObject

/**
 * The width of the ad companion.
 */
@property (nonatomic, readonly) NSInteger width;

/**
 * The height of the ad companion.
 */
@property (nonatomic, readonly) NSInteger height;

/**
 * The (MIME) type of the ad companion.
 */
@property (nonatomic, readonly, nullable) NSString *type;

/**
 * The source of the ad companion.
 */
@property (nonatomic, readonly, nullable) NSString *source;

/**
 * The trackers of the companion ad.
 */
@property (nonatomic, readonly, nullable) NSDictionary<NSString *, NSArray<NSString *> *> *trackers;

/**
 * The clickthrough url of the companion ad.
 */
@property (nonatomic, readonly, nullable) NSString *clickThrough;

/**
 * Initializes an AdCompanion object from a dictionary.
 */
- (instancetype _Nonnull)initFromDictionary:(NSDictionary * _Nonnull)dictionary;

/**
 * Initializes an array of AdCompanions from an array of dictionaries.
 */
+ (NSArray<AdCompanion *> * _Nullable)initArrayFromArrayOfDict:(NSArray<NSDictionary *> * _Nullable)dictionaries;

@end
