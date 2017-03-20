package com.jwplayer.showcase.sender.ads;

import com.google.android.gms.cast.AdBreakInfo;
import com.google.android.gms.cast.MediaStatus;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;

import java.util.List;

/**
 * A {@link com.google.android.gms.cast.framework.media.RemoteMediaClient.ParseAdsInfoCallback} for
 * the JW Player Showcase Chromecast Receiver.
 */
public class ParseAdsInfoCallback implements RemoteMediaClient.ParseAdsInfoCallback {

	@Override
	public boolean parseIsPlayingAdFromMediaStatus(MediaStatus mediaStatus) {
		return mediaStatus.getAdBreakStatus() != null;
	}

	@Override
	public List<AdBreakInfo> parseAdBreaksFromMediaStatus(MediaStatus mediaStatus) {
		return mediaStatus.getMediaInfo().getAdBreaks();
	}

}
