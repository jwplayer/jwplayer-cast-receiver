// Copyright 2013 Google Inc.

#import <GoogleCast/GCKDefines.h>

#import <Foundation/Foundation.h>

#ifdef USE_CAST_DYNAMIC_FRAMEWORK
#define GCKDeviceScannerClass NSClassFromString(@"GCKDeviceScanner")
#endif

@class GCKDevice;
@class GCKFilterCriteria;
@protocol GCKDeviceScannerListener;

GCK_ASSUME_NONNULL_BEGIN

/**
 * A class that asynchronously scans for available devices and sends corresponding notifications to
 * its listener(s). This class is implicitly a singleton; since it does a network scan, it isn't
 * useful to have more than one instance of it in use.
 *
 * @deprecated Use GCKDiscoveryManager to discover Cast receivers.
 */
GCK_EXPORT
@interface GCKDeviceScanner : NSObject

/** The array of discovered devices. */
@property(nonatomic, readonly, copy) NSArray *devices;

/** Whether the current/latest scan has discovered any devices. */
@property(nonatomic, readonly) BOOL hasDiscoveredDevices;

/** Whether a scan is currently in progress. */
@property(nonatomic, readonly) BOOL scanning;

/** The current filtering criteria. */
@property(nonatomic, copy, readwrite) GCKFilterCriteria *filterCriteria;

/**
 * Whether the scan should be a passive scan. A passive scan sends discovery queries less
 * frequently, so it is more efficient, but the results will not be as fresh. It's appropriate to
 * do a passive scan when the user is not actively selecting a Cast target.
 */
@property(nonatomic, assign, readwrite) BOOL passiveScan;

/**
 * Constructs a new GCKDeviceScanner.
 *
 * @deprecated Use @ref initWithFilterCriteria: instead; do not use without a criteria.
 */
- (instancetype)init GCK_DEPRECATED("Use initWithFilterCriteria, do not use without a criteria");

/**
 * Designated initializer. Constructs a new GCKDeviceScanner with the given filter criteria.
 *
 * @param filterCriteria The filter criteria. May not be <code>nil</code>.
 */
- (instancetype)initWithFilterCriteria:(GCKFilterCriteria *GCK_NULLABLE_TYPE)filterCriteria;

/**
 * Starts a new device scan. The scan must eventually be stopped by calling
 * @ref stopScan.
 */
- (void)startScan;

/**
 * Stops any in-progress device scan. This method <b>must</b> be called at some point after
 * @ref startScan was called and before this object is released by its owner.
 */
- (void)stopScan;

/**
 * Adds a listener for receiving notifications.
 *
 * @param listener The listener to add.
 */
- (void)addListener:(id<GCKDeviceScannerListener>)listener;

/**
 * Removes a listener that was previously added with @ref addListener:.
 *
 * @param listener The listener to remove.
 */
- (void)removeListener:(id<GCKDeviceScannerListener>)listener;

@end

/**
 * The GCKDeviceScanner listener protocol.
 *
 * @deprecated Use GCKDiscoveryManager and GCKDiscoveryManagerListener to discover Cast receivers.
 */
GCK_EXPORT
@protocol GCKDeviceScannerListener <NSObject>

@optional

/**
 * Called when a device has been discovered or has come online.
 *
 * @param device The device.
 */
- (void)deviceDidComeOnline:(GCKDevice *)device;

/**
 * Called when a device has gone offline.
 *
 * @param device The device.
 */
- (void)deviceDidGoOffline:(GCKDevice *)device;

/**
 * Called when there is a change to one or more properties of the device that do not affect
 * connectivity to the device. This includes all properties except the device ID, IP address,
 * and service port; if any of these properties changes, the device will be reported as "offline"
 * and a new device with the updated properties will be reported as "online".
 *
 * @param device The device.
 */
- (void)deviceDidChange:(GCKDevice *)device;

@end

GCK_ASSUME_NONNULL_END
