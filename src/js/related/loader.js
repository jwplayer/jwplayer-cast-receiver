import Http from '../utils/http';

export const BASE_URL = 'https://content.jwplatform.com/feed.json';

export default class RelatedLoader {

    static load(feedId, mediaId) {
        return new Promise((resolve, reject) => {
            Http.get(`${BASE_URL}?feed_id=${feedId}&related_media_id=${mediaId}`).then(response => {
                if (!response.kind || response.kind != 'FEED') {
                    reject(`Error: Feed ${feedId} is not a related feed!`);
                }
                resolve(response);
            }, reject);
        });
    }
}
