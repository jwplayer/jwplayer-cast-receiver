import JWMediaManager from './cast/mediamanager';
import UIController from './uicontroller';
import RelatedController from './related/controller';
import EventBus, * as Events from './events';
import AnalyticsConfig from './analytics/config';
import TimeOutHandler from './utils/timeouthandler';

export const APP_VERSION = '1.0.0';

/* eslint no-unused-vars: 0*/

export default function JWCastApp(element, config) {
    // Create an event bus.
    let events = new EventBus();

    let timeoutHandler;

    // Create a receiver manager and apply overrides.
    let receiverManager = cast.framework.CastReceiverContext.getInstance();
    receiverManager.onReady = (event) => {
        events.publish(Events.APP_READY, event);

        // Create a timeout handler.
        timeoutHandler = new TimeOutHandler(events, receiverManager);
    };

    receiverManager.onSenderDisconnected = function(event) {
        // When the last or only sender is connected to a receiver,
        // tapping Disconnect stops the app running on the receiver.
        if (receiverManager.getSenders().length === 0 &&
            event.reason === cast.receiver.system.DisconnectReason.REQUESTED_BY_SENDER) {
            receiverManager.stop();
        }
    };

    // Create a media manager.
    let mediaManager = new JWMediaManager(receiverManager, document.getElementById('player'),
        events, new AnalyticsConfig(config));

    // Create some UI.
    let uiController = new UIController(element, events, config, mediaManager);

    // Create a related controller.
    if (typeof (config.recommendationsPlaylist) === 'string') {
        let relatedController = new RelatedController(config, events, mediaManager);
    }

    const options = new cast.framework.CastReceiverOptions();

    // all namespaces are defined by a string and must begin with "urn:x-cast:" followed by any string
    // https://developers.google.com/cast/docs/web_receiver/core_features#custom_messages
    options.customNamespaces = {
        'urn:x-cast:jw.custom.receiver': cast.framework.system.MessageType.JSON,
        'urn:x-cast:com.google.cast.media' : cast.framework.system.MessageType.JSON
    };

    // Start the application!
    receiverManager.start(options);
}
