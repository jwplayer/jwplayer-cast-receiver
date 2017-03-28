package com.jwplayer.showcase.sender.ads;


import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

/**
 * An object containing ad metadata.
 */

public class AdMeta {

	private static final String TAG = "AdMeta";

	/**
	 * The type of the ad, either linear or nonlinear.
	 */
	public final String adType;

	/**
	 * Randomly generated identifier of the ad.
	 */
	public final String id;

	/**
	 * The ad tag.
	 */
	public final String tag;

	/**
	 * The ad client either "vast" or "googima".
	 */
	public final String client;

	/**
	 * The waterfall index of the ad.
	 */
	public final int wItem;

	/**
	 * The amount of waterfall ads.
	 */
	public final int wCount;

	/**
	 * The index of the ad in a pod.
	 */
	public final int sequence;

	/**
	 * The length of the ad pod.
	 */
	public final int podCount;

	/**
	 * The creative type of the ad, can be linear or nonlinear.
	 */
	public final String creativeType;

	/**
	 * The skip offset of the ad.
	 */
	public final int skipOffset;

	/**
	 * The skip message of the ad (default: "Skip ad in xx").
	 */
	public final String skipMessage;

	/**
	 * The text of the skip button of the ad (default: "Skip").
	 */
	public final String skipText;

	/**
	 * The ad display message (default: "This ad will end in xx seconds.").
	 */
	public final String message;

	/**
	 * The click through url of the ad.
	 */
	public final String clickThrough;

	/**
	 * The title of the ad.
	 */
	public final String title;

	/**
	 * The companions of this ad.
	 */
	public final List<AdCompanion> companions;

	/**
	 * Creates an AdMeta object from JSON.
	 * @param json the json to generate an object from.
	 */
	/* package */ AdMeta(JSONObject json) {
		if (json.has("linear")) {
			adType = json.optString("linear");
		} else {
			adType = "linear";
		}
		id = json.optString("id");
		tag = json.optString("tag");
		client = json.optString("client");
		wItem = json.optInt("witem", 1);
		wCount = json.optInt("wcount", 1);
		sequence = json.optInt("sequence", 1);
		podCount = json.optInt("podcount", 1);
		creativeType = json.optString("creativetype");
		skipOffset = json.optInt("skipoffset", 0);
		skipMessage = json.optString("skipMessage");
		skipText = json.optString("skipText");
		message = json.optString("message");
		clickThrough = json.optString("clickthrough");
		title = json.optString("title");
		companions = AdCompanion.fromJSONArray(json.optJSONArray("companions"));
	}

	public JSONObject toJSON() {
		try {
			JSONObject json = new JSONObject();
			json.put("id", id);
			json.put("tag", tag);
			json.put("client", client);
			json.put("witem", wItem);
			json.put("wcount", wCount);
			json.put("sequence", sequence);
			json.put("podcount", podCount);
			json.put("creativetype", creativeType);
			json.put("skipoffset", skipOffset);
			json.put("skipMessage", skipMessage);
			json.put("skipText", skipText);
			json.put("message", message);
			json.put("clickthrough", clickThrough);
			json.put("title", title);
			json.put("companions", AdCompanion.toJSONArray(companions));
			return json;
		} catch (JSONException je) {
			Log.e(TAG, "Error serializing AdMeta: " + je.getMessage());
			return null;
		}
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (o == null || getClass() != o.getClass()) return false;

		AdMeta adMeta = (AdMeta) o;

		if (wItem != adMeta.wItem) return false;
		if (wCount != adMeta.wCount) return false;
		if (sequence != adMeta.sequence) return false;
		if (podCount != adMeta.podCount) return false;
		if (skipOffset != adMeta.skipOffset) return false;
		if (adType != null ? !adType.equals(adMeta.adType) : adMeta.adType != null)
			return false;
		if (id != null ? !id.equals(adMeta.id) : adMeta.id != null) return false;
		if (tag != null ? !tag.equals(adMeta.tag) : adMeta.tag != null) return false;
		if (client != null ? !client.equals(adMeta.client) : adMeta.client != null)
			return false;
		if (creativeType != null ? !creativeType.equals(adMeta.creativeType) : adMeta.creativeType != null)
			return false;
		if (skipMessage != null ? !skipMessage.equals(adMeta.skipMessage) : adMeta.skipMessage != null)
			return false;
		if (skipText != null ? !skipText.equals(adMeta.skipText) : adMeta.skipText != null)
			return false;
		if (message != null ? !message.equals(adMeta.message) : adMeta.message != null)
			return false;
		if (clickThrough != null ? !clickThrough.equals(adMeta.clickThrough) : adMeta.clickThrough != null)
			return false;
		if (title != null ? !title.equals(adMeta.title) : adMeta.title != null) return false;
		return companions != null ? companions.equals(adMeta.companions) : adMeta.companions == null;

	}

	@Override
	public int hashCode() {
		int result = adType != null ? adType.hashCode() : 0;
		result = 31 * result + (id != null ? id.hashCode() : 0);
		result = 31 * result + (tag != null ? tag.hashCode() : 0);
		result = 31 * result + (client != null ? client.hashCode() : 0);
		result = 31 * result + wItem;
		result = 31 * result + wCount;
		result = 31 * result + sequence;
		result = 31 * result + podCount;
		result = 31 * result + (creativeType != null ? creativeType.hashCode() : 0);
		result = 31 * result + skipOffset;
		result = 31 * result + (skipMessage != null ? skipMessage.hashCode() : 0);
		result = 31 * result + (skipText != null ? skipText.hashCode() : 0);
		result = 31 * result + (message != null ? message.hashCode() : 0);
		result = 31 * result + (clickThrough != null ? clickThrough.hashCode() : 0);
		result = 31 * result + (title != null ? title.hashCode() : 0);
		result = 31 * result + (companions != null ? companions.hashCode() : 0);
		return result;
	}
}
