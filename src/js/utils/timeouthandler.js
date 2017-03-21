import { USER_ACTIVITY, STATE_CHANGE } from '../events';
import { PlayerState } from '../cast/playerstate';

// Timeout Treshold, currently set to 20 minutes.
export const TIMEOUT_TRESHOLD = 20 * 60 * 1000;

export default function TimeOutHandler(events, receiverManager) {

    let timeoutId = -1;
    let playerState;

    events.subscribe(USER_ACTIVITY, handleActivity);
    events.subscribe(STATE_CHANGE, (event) => {
        playerState = event.newState;
        handleActivity();
    });

    function handleActivity() {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(onActivityTimeout, TIMEOUT_TRESHOLD);
    }

    function onActivityTimeout() {
        if (playerState != PlayerState.BUFFERING
            && playerState != PlayerState.PLAYING) {
            receiverManager.stop();
        }
    }

    handleActivity();
}
