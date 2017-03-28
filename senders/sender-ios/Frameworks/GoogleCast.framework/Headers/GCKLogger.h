// Copyright 2013 Google Inc.

#import <GoogleCast/GCKLoggerCommon.h>

#import <GoogleCast/GCKDefines.h>

#import <Foundation/Foundation.h>

#ifdef USE_CAST_DYNAMIC_FRAMEWORK
#define GCKLoggerClass NSClassFromString(@"GCKLogger")
#endif

@protocol GCKLoggerDelegate;
@class GCKLoggerFilter;

GCK_ASSUME_NONNULL_BEGIN

/**
 * A singleton object used for logging by the framework. If a delegate is assigned, the formatted
 * log messages are passed to the delegate. Otherwise, the messages are written using
 * <a href="https://goo.gl/EwUYP8"><b>NSLog()</b></a> in debug builds and are discarded otherwise.
 *
 * See GCKLoggerDelegate for the delegate protocol.
 */
GCK_EXPORT
@interface GCKLogger : NSObject

/** The delegate to pass log messages to. */
@property(nonatomic, weak, readwrite, GCK_NULLABLE) id<GCKLoggerDelegate> delegate;

/**
 * The filter to apply to log messages.
 *
 * @since 3.0
 */
@property(nonatomic, strong, readwrite, GCK_NULLABLE) GCKLoggerFilter *filter;

/**
 * Flag for enabling or disabling logging. On by default.
 *
 * @since 3.0
 */
@property(nonatomic, assign, readwrite) BOOL loggingEnabled;

/**
 * Flag for enabling or disabling file logging. Off by default.
 *
 * @since 3.1
 */
@property(nonatomic, assign, readwrite) BOOL fileLoggingEnabled;

/**
 * The maximum size of a log file, in bytes. The minimum is 32 KiB. If the value is 0, the default
 * maximum size of 2 MiB will be used.
 *
 * @since 3.1
 */
@property(nonatomic, assign, readwrite) unsigned long long maxLogFileSize;

/**
 * The maximum number of log files. The minimum is 2.
 *
 * @since 3.1
 */
@property(nonatomic, assign, readwrite) NSUInteger maxLogFileCount;

/**
 * The minimum logging level that will be logged.
 *
 * @since 3.0
 */
@property(nonatomic, assign, readwrite) GCKLoggerLevel minimumLevel;

/**
 * Returns the GCKLogger singleton instance.
 */
+ (GCKLogger *)sharedInstance;

/**
 * Logs a message.
 *
 * @param function The calling function, normally <code>__func__</code>.
 * @param format The format string.
 */
- (void)logFromFunction:(const char *)function
                message:(NSString *)format, ... NS_FORMAT_FUNCTION(2, 3);

@end

/**
 * The GCKLogger delegate protocol.
 */
GCK_EXPORT
@protocol GCKLoggerDelegate <NSObject>

@optional

/**
 * Logs a message.
 *
 * @deprecated Use GCKLoggerDelegate::logMessage:fromFunction: instead.
 *
 * @param function The calling function, normally <code>__func__</code>.
 * @param message The log message.
 */
- (void)logFromFunction:(const char *)function
                message:(NSString *)message
    GCK_DEPRECATED("Use -[GCKLoggerDelegate logMessage:fromFunction:]");

/**
 * Logs a message.
 *
 * @param function The calling function, normally obtained from <code>__func__</code>.
 * @param message The log message.
 */
- (void)logMessage:(NSString *)message fromFunction:(NSString *)function;

@end

GCK_ASSUME_NONNULL_END

/**
 * @macro GCKLog
 *
 * A convenience macro for logging to the GCKLogger singleton. This is a drop-in replacement
 * for <a href="https://goo.gl/EwUYP8"><b>NSLog()</b></a>.
 */
#define GCKLog(FORMAT, ...) \
  [[GCKLogger sharedInstance] logFromFunction:__func__ message:FORMAT, ##__VA_ARGS__]

/**
 * @macro GCKDebugLog
 *
 * A convenience macro for using GCKLog in performance sensitive code intended only to be triggered
 * in diagnostic debug builds. This should be used only sparingly since this macro completely
 * removes GCKLog in release builds.  This is useful for eliminating extra logging calls, but
 * sacrifices the ability to configure logging in a release build.
 */
#ifdef DEBUG
#define GCKDebugLog GCKLog
#else
#define GCKDebugLog
#endif
