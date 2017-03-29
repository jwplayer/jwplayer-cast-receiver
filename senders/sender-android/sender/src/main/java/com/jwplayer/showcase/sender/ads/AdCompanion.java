package com.jwplayer.showcase.sender.ads;

import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

/**
 * A companion ad.
 */
public class AdCompanion {

	private static final String TAG = "AdCompanion";

	/**
	 * The width of the ad companion.
	 */
	public final int width;

	/**
	 * The height of the ad companion.
	 */
	public final int height;

	/**
	 * The (MIME) type of the ad companion.
	 */
	public final String type;

	/**
	 * The source of the ad companion.
	 */
	public final String source;

	/**
	 * The trackers of the companion ad.
	 */
	public final Map<String, String[]> trackers = new HashMap<>();

	/**
	 * The clickthrough url of the companion ad.
	 */
	public final String clickThrough;

	private AdCompanion(JSONObject json) {
		width = json.optInt("width");
		height = json.optInt("height");
		type = json.optString("type");
		source = json.optString("source");
		JSONObject trackers = json.optJSONObject("trackers");
		if (trackers != null) {
			for (Iterator<String> iter = trackers.keys(); iter.hasNext();) {
				String tracker = iter.next();
				JSONArray pingUrls = trackers.optJSONArray(tracker);
				if (pingUrls != null) {
					String[] urls = new String[pingUrls.length()];
					for (int i = 0; i < pingUrls.length(); i++) {
						urls[i] = pingUrls.optString(i);
					}
					this.trackers.put(tracker, urls);
				}
			}
		}
		clickThrough = json.optString("clickthrough");
	}

	public JSONObject toJSON() {
		JSONObject json = new JSONObject();
		try {
			json.put("width", width);
			json.put("height", height);
			json.put("type", type);
			json.put("source", source);
			JSONObject trackers = new JSONObject();
			for (Map.Entry<String, String[]> entry : this.trackers.entrySet()) {
				JSONArray trackerUrls = new JSONArray();
				String[] urls = entry.getValue();
				for (String url : urls) {
					trackerUrls.put(url);
				}
				trackers.put(entry.getKey(), trackerUrls);
			}
			json.put("trackers", trackers);
			json.put("clickthrough", clickThrough);
			return json;
		} catch (JSONException je) {
			Log.e(TAG, "Error serializing AdCompanion: " + je.getMessage());
			return null;
		}
	}

	/* package */ static List<AdCompanion> fromJSONArray(JSONArray array) {
		try {
			LinkedList<AdCompanion> adCompanions = new LinkedList<>();
			for (int i = 0; i < array.length(); i++) {
				adCompanions.add(new AdCompanion(array.getJSONObject(i)));
			}
			return adCompanions;
		} catch (JSONException je) {
			Log.e(TAG, "Error de-serializing AdCompanions: " + je.getMessage());
			return null;
		}
	}

	public static JSONArray toJSONArray(List<AdCompanion> companions) {
		JSONArray array = new JSONArray();
		for (AdCompanion companion : companions) {
			array.put(companion.toJSON());
		}
		return array;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (o == null || getClass() != o.getClass()) return false;

		AdCompanion that = (AdCompanion) o;

		if (width != that.width) return false;
		if (height != that.height) return false;
		if (type != null ? !type.equals(that.type) : that.type != null)
			return false;
		if (source != null ? !source.equals(that.source) : that.source != null) return false;
		if (trackers != null ? !trackers.equals(that.trackers) : that.trackers != null)
			return false;
		return clickThrough != null ? clickThrough.equals(that.clickThrough) : that.clickThrough == null;

	}

	@Override
	public int hashCode() {
		int result = width;
		result = 31 * result + height;
		result = 31 * result + (type != null ? type.hashCode() : 0);
		result = 31 * result + (source != null ? source.hashCode() : 0);
		result = 31 * result + (trackers != null ? trackers.hashCode() : 0);
		result = 31 * result + (clickThrough != null ? clickThrough.hashCode() : 0);
		return result;
	}
}
