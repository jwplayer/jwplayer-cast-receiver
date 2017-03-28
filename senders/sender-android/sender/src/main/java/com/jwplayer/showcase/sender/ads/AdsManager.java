package com.jwplayer.showcase.sender.ads;

import com.google.android.gms.cast.MediaStatus;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;

import org.json.JSONObject;

/**
 * Responsible for notifying a listener with Ads Status updates.
 */
public class AdsManager implements RemoteMediaClient.Listener {

	private RemoteMediaClient mRemoteMediaClient;

	/**
	 * Whether an ad is currently playing.
	 */
	private boolean mAdPlaying = false;

	/**
	 * The last received ad metadata.
	 */
	private AdMeta mLastAdMeta;

	/**
	 * The current listener for ad meta.
	 */
	private Listener mListener;

	public AdsManager(RemoteMediaClient remoteMediaClient) {
		setRemoteMediaClient(remoteMediaClient);
	}

	public void setRemoteMediaClient(RemoteMediaClient remoteMediaClient) {
		if (remoteMediaClient.equals(mRemoteMediaClient)) {
			return;
		}
		mRemoteMediaClient = remoteMediaClient;
		mRemoteMediaClient.addListener(this);
	}

	public void setListener(Listener listener) {
		mListener = listener;
	}

	public interface Listener {
		/**
		 * Called when Ad Metadata has been received from the receiver.
		 * @param adMeta the metadata received.
		 */
		void onAdMeta(AdMeta adMeta);

		/**
		 * Called when the receiver signals that ad playback has begun.
		 */
		void onAdPlay();

		/**
		 * Called when the receiver signals that ad playback has ended.
		 */
		void onAdEnded();
	}

	@Override
	public void onStatusUpdated() {
		// Check for Ad Meta.
		MediaStatus mediaStatus = mRemoteMediaClient.getMediaStatus();
		if (mediaStatus != null) {
			JSONObject customData = mediaStatus.getCustomData();
			if (customData != null) {
				JSONObject adMeta = customData.optJSONObject("adMeta");
				if (adMeta != null) {
					AdMeta meta = new AdMeta(adMeta);
					if (!meta.equals(mLastAdMeta) && mListener != null) {
						mListener.onAdMeta(meta);
					}
					mLastAdMeta = meta;
				}
			}
		}

		// Check for Ad Play.
		if (mRemoteMediaClient.isPlayingAd() != mAdPlaying) {
			mAdPlaying = mRemoteMediaClient.isPlayingAd();
			if (mAdPlaying && mListener != null) {
				mListener.onAdPlay();
			} else if (!mAdPlaying && mListener != null) {
				mListener.onAdEnded();
			}
		}
	}

	@Override
	public void onMetadataUpdated() {

	}

	@Override
	public void onQueueStatusUpdated() {

	}

	@Override
	public void onPreloadStatusUpdated() {

	}

	@Override
	public void onSendingRemoteMediaRequest() {

	}

	@Override
	public void onAdBreakStatusUpdated() {

	}

}
