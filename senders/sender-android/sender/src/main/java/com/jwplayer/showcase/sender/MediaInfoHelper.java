package com.jwplayer.showcase.sender;

import com.google.android.gms.cast.MediaInfo;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * A helper class for building MediaInfo objects.
 */
public class MediaInfoHelper {

	/**
	 * Sets an Ad Schedule in the given customData section and sets that on the MediaInfo.
	 *
	 * @param mediaInfo The {@link MediaInfo} object to set the AdSchedule on.
	 * @param advertising The advertising object to set on the MediaInfo.
	 * @param customData The customData section to set the advertising on.
	 * @return the updated MediaInfo object.
	 * @throws JSONException if the advertising section is already present.
	 */
	public static MediaInfo.Builder setAdvertising(MediaInfo.Builder mediaInfo, JSONObject advertising, JSONObject customData) throws JSONException {
		if (!advertising.has("client")) {
			throw new IllegalArgumentException("Advertising does not have a client!");
		}
		if (!advertising.has("schedule")) {
			throw new IllegalArgumentException("Advertising is missing an schedule!");
		}
		customData.put("advertising", advertising);
		mediaInfo.setCustomData(customData);
		return mediaInfo;
	}

	/**
	 * Sets a mediaId in the given customData object on the given MediaInfo.
	 *
	 * @param mediaInfo The {@link MediaInfo} object to set the MediaId on.
	 * @param mediaId The mediaId to set.
	 * @param customData The customData section in which the mediaId should be set.
	 * @return the updated MediaInfo object
	 * @throws JSONException if the mediaId is already present.
	 */
	public static MediaInfo.Builder setMediaId(MediaInfo.Builder mediaInfo, String mediaId, JSONObject customData) throws JSONException {
		if (mediaId == null) {
			throw new IllegalArgumentException("mediaId is null!");
		}
		customData.put("mediaid", mediaId);
		mediaInfo.setCustomData(customData);
		return mediaInfo;
	}
}
