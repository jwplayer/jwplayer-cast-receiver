//
//  AdMeta.m
//  Sender
//
//  Created by Rik Heijdens on 1/24/17.
//  Copyright © 2017 JW Player. All rights reserved.
//

#import "AdMeta.h"

@implementation AdMeta

- (instancetype)initFromDictionary:(NSDictionary *)dictionary {
    if (self = [super init]) {
        _adType = dictionary[@"linear"] != [NSNull null] ? dictionary[@"linear"] : @"linear";
        _adId = dictionary[@"id"] != [NSNull null] ? dictionary[@"id"] : nil;
        _tag = dictionary[@"tag"] != [NSNull null] ? dictionary[@"tag"] : nil;
        _client = dictionary[@"client"] != [NSNull null] ? dictionary[@"client"] : nil;
        _wItem = dictionary[@"witem"] && dictionary[@"witem"] != [NSNull null] ? [dictionary[@"witem"] integerValue] : 0;
        _wCount = dictionary[@"wcount"] && dictionary[@"wcount"] != [NSNull null] ? [dictionary[@"wcount"] integerValue] : 0;
        _sequence = dictionary[@"sequence"] && dictionary[@"sequence"] != [NSNull null] ? [dictionary[@"sequence"] integerValue] : 0;
        _podCount = dictionary[@"podcount"] && dictionary[@"podcount"] != [NSNull null] ? [dictionary[@"podcount"] integerValue] : 0;
        _creativeType = dictionary[@"creativetype"] && dictionary[@"creativetype"] != [NSNull null] ? dictionary[@"creativetype"] : nil;
        _skipOffset = dictionary[@"skipoffset"] && dictionary[@"skipoffset"] != [NSNull null] ? [dictionary[@"skipoffset"] integerValue] : 0;
        _skipMessage = dictionary[@"skipMessage"] && dictionary[@"skipMessage"] != [NSNull null] ? dictionary[@"skipMessage"] : nil;
        _skipText = dictionary[@"skipText"] && dictionary[@"skipText"] != [NSNull null] ? dictionary[@"skipText"] : nil;
        _message = dictionary[@"message"] && dictionary[@"message"] != [NSNull null] ? dictionary[@"message"] : nil;
        _clickThrough = dictionary[@"clickthrough"] && dictionary[@"clickthrough"] != [NSNull null] ? dictionary[@"clickthrough"] : nil;
        _title = dictionary[@"title"] && dictionary[@"title"] != [NSNull null] ? dictionary[@"title"] : nil;
        _companions = dictionary[@"companions"] && dictionary[@"companions"] != [NSNull null] ?
            [AdCompanion initArrayFromArrayOfDict:dictionary[@"companions"]] : nil;
    }
    return self;
}


-(BOOL)isEqual:(id)object {
    if (self == object) return true;
    if (object == nil || ![object isKindOfClass:[self class]]) return NO;
    
    AdMeta *adMeta = (AdMeta *)object;
    if (_wItem != adMeta.wItem) return NO;
    if (_wCount != adMeta.wCount) return NO;
    if (_sequence != adMeta.sequence) return NO;
    if (_podCount != adMeta.podCount) return NO;
    if (_skipOffset != adMeta.skipOffset) return NO;
    if (![_adType isEqualToString:adMeta.adType]) return NO;
    if (![_adId isEqualToString:adMeta.adId]) return NO;
    if (![_tag isEqualToString:adMeta.tag]) return NO;
    if (![_client isEqualToString:adMeta.client]) return NO;
    if (![_creativeType isEqualToString:adMeta.creativeType]) return NO;
    if (![_skipMessage isEqualToString:adMeta.skipMessage]) return NO;
    if (![_skipText isEqualToString:adMeta.skipText]) return NO;
    if (![_message isEqualToString:adMeta.message]) return NO;
    if (![_clickThrough isEqualToString:adMeta.clickThrough]) return NO;
    if (![_title isEqualToString:adMeta.title]) return NO;
    return _companions != nil ? [_companions isEqualToArray:adMeta.companions] : adMeta.companions == nil;
}

- (NSUInteger)hash {
    NSUInteger result = _adType != nil ? [_adType hash] : 0;
    result = 31 * result + (_adId != nil ? [_adId hash] : 0);
    result = 31 * result + (_tag != nil ? [_tag hash] : 0);
    result = 31 * result + (_client != nil ? [_client hash] : 0);
    result = 31 * result + _wItem;
    result = 31 * result + _wCount;
    result = 31 * result + _sequence;
    result = 31 * result + _podCount;
    result = 31 * result + (_creativeType != nil ? [_creativeType hash] : 0);
    result = 31 * result + _skipOffset;
    result = 31 * result + (_skipMessage != nil ? [_skipMessage hash] : 0);
    result = 31 * result + (_skipText != nil ? [_skipText hash] : 0);
    result = 31 * result + (_message != nil ? [_message hash] : 0);
    result = 31 * result + (_clickThrough != nil ? [_clickThrough hash] : 0);
    result = 31 * result + (_title != nil ? [_title hash] : 0);
    result = 31 * result + (_companions != nil ? [_companions hash] : 0);
    return result;
}

@end
