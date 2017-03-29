//
//  AdCompanion.m
//  Sender
//
//  Created by Rik Heijdens on 1/24/17.
//  Copyright © 2017 JW Player. All rights reserved.
//

#import "AdCompanion.h"

@implementation AdCompanion

- (instancetype)initFromDictionary:(NSDictionary *)dictionary {
    if (self = [super init]) {
        _width = dictionary[@"width"] && dictionary[@"width"] != [NSNull null] ? [dictionary[@"width"] integerValue] : 0;
        _height = dictionary[@"height"] && dictionary[@"height"] != [NSNull null] ? [dictionary[@"height"] integerValue] : 0;
        _type = dictionary[@"type"] && dictionary[@"type"] != [NSNull null] ? dictionary[@"type"] : nil;
        _source = dictionary[@"source"] && dictionary[@"source"] != [NSNull null] ? dictionary[@"source"] : nil;
        _trackers = dictionary[@"trackers"] && dictionary[@"trackers"] != [NSNull null] ? dictionary[@"trackers"] : nil;
        _clickThrough = dictionary[@"clickthrough"] && dictionary[@"clickthrough"] != [NSNull null] ? dictionary[@"clickthrough"] : nil;
    }
    return self;
}

+ (NSArray<AdCompanion *> *)initArrayFromArrayOfDict:(NSArray<NSDictionary *> *)dictionaries {
    NSMutableArray<AdCompanion *> *companions;
    if (dictionaries != nil) {
        companions = [NSMutableArray new];
        if (dictionaries.count != 0) {
            for (NSDictionary *companion in dictionaries) {
                [companions addObject:[[AdCompanion alloc] initFromDictionary:companion]];
            }
        }
    }
    return companions;
}

@end
