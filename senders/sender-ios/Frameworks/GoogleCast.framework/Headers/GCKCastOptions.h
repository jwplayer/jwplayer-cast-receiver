// Copyright 2015 Google Inc.

#import <GoogleCast/GCKDefines.h>

#import <Foundation/Foundation.h>

@class GCKLaunchOptions;

GCK_ASSUME_NONNULL_BEGIN

/**
 * Options that affect the discovery of Cast devices and the behavior of Cast sessions. Writable
 * properties must be set before passing this object to the GCKCastContext.
 *
 * @since 3.0
 */
GCK_EXPORT
@interface GCKCastOptions : NSObject <NSCopying>

/**
 * Constructs a new GCKCastOptions object with the specified receiver application ID.
 *
 * @param applicationID The ID of the receiver application which must be supported by discovered
 * Cast devices, and which will be launched when starting a new Cast session.
 */
- (instancetype)initWithReceiverApplicationID:(NSString *)applicationID;

/**
 * Constructs a new GCKCastOptions object with the specified list of namespaces.
 *
 * @param namespaces A list of namespaces which must be supported by the currently running receiver
 * application on each discovered Cast device.
 */
- (instancetype)initWithSupportedNamespaces:(NSArray<NSString *> *)namespaces;

/**
 * A flag indicating whether the sender device's physical volume buttons should control the
 * session's volume.
 */
@property(nonatomic, assign, readwrite) BOOL physicalVolumeButtonsWillControlDeviceVolume;

/**
 * The receiver launch options to use when starting a Cast session.
 */
@property(nonatomic, copy, readwrite, GCK_NULLABLE) GCKLaunchOptions *launchOptions;

/**
 * The shared container identifier to use for background HTTP downloads that are performed by the
 * framework.
 *
 * @since 3.2
 */
@property(nonatomic, copy, readwrite, GCK_NULLABLE) NSString *sharedContainerIdentifier;

@end

GCK_ASSUME_NONNULL_END
