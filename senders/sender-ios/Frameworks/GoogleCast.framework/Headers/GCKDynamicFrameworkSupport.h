// Copyright 2016 Google Inc.

#import <Foundation/Foundation.h>

#import <GoogleCast/GCKDefines.h>

#if TARGET_OS_IPHONE
#ifdef USE_CAST_DYNAMIC_FRAMEWORK
#import <dlfcn.h>

GCK_EXPORT
@interface GCKDynamicFrameworkSupport : NSObject
+ (BOOL)isCastSupported;
@end

#define GCKDynamicFrameworkSupportLibClass NSClassFromString(@"GCKDynamicFrameworkSupportLib")

// Note: Do not call these directly.
GCK_EXPORT
@interface GCKDynamicFrameworkSupportLib : NSObject
+ (NSString const *)getConstNSString:(NSString *)key;
+ (const NSInteger)getConstNSInteger:(NSString *)key;
+ (const UIControlState)getConstUIControlState:(NSString *)key;
+ (const NSTimeInterval)getConstNSTimeInterval:(NSString *)key;
@end

#define INIT_DYNAMIC_FRAMEWORK_SUPPORT                                                    \
  @implementation GCKDynamicFrameworkSupport                                              \
  +(BOOL)isCastSupported {                                                                \
    if ([[[UIDevice currentDevice] systemVersion] compare:@"8.0" options:NSNumericSearch] \
        == NSOrderedAscending) {                                                          \
      return NO;                                                                          \
    }                                                                                     \
    void *lib_handle = NULL;                                                              \
    if (!lib_handle) {                                                                    \
      lib_handle = dlopen("GoogleCast.framework/GoogleCast", RTLD_NOW);                   \
    }                                                                                     \
    if (!lib_handle) {                                                                    \
      NSLog(@"Unable to open the GoogeCast dynamic framework: %s\n", dlerror());          \
      return NO;                                                                          \
    }                                                                                     \
    dlclose(lib_handle);                                                                  \
    return YES;                                                                           \
  }                                                                                       \
  @end

#endif  // USE_CAST_DYNAMIC_FRAMEWORK
#endif  // TARGET_OS_IPHONE
