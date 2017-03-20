# JW Player Custom Chromecast Receiver

## Building the receiver

```bash
# Install dependencies
npm install -g gulp-cli && npm install

# Build the receiver
gulp build

# Serve the receiver
gulp serve

# Rebuilding the receiver on changes and serving the receiver
gulp serve watch
```

For debug builds, the build script will try to copy jwplayer.js (and assets) from `../../jwplayer-commercial/bin-debug/`.
If this fails, the script will build against a player on the CDN, the version of the player it builds against is defined in the build script.

## Using the receiver

You need to [register](https://cast.google.com/u/0/publish/#/overview) the receiver with Google.
This requires you to sign up for the Cast SDK Developer console.

The receiver will use the `appName` from the search portion of the receiver URL in order to load the config file.
So when for example your appName is `cast-test` you need to register the following receiver URL with Google: `https://path-to-receiver?appName=cast-test`.

## Available gulp tasks

We're using gulp as build system, currently the following tasks are available:

```code
$ gulp --tasks-simple
serve         # starts a http server that serves the receiver.
clean         # cleans the build directories.
watch         # watches the src directories for changes.
default       # invokes build.
build         # builds a debug and a release version of the receiver.
build:debug   # builds a debug version of the receiver.
build:release # builds a release version of the receiver.
dev           # meta-task that invokes both serve and watch.
```

## Using debug builds

Debug builds will not load configuration files from `https://<appName>.jwpapp.com/config.json`, but from the `config` folder in the repository.
For example: after you execute `gulp build serve` the receiver will be hosted at `http://localhost:8080`, but if you load that URL it does not know which config file it should load, hence the receiver won't work. In order to load the config from `/config/sample/config.json` you need to set the `appName` parameter to `sample` like this: `http://localhost:8080?appName=sample`.

## Receiver States

- `app-state-loading`: The application is loading.
- `app-state-idle`: The application has been loaded and content can be Cast.
- `content-state-loading`: Content has been cast, and the application is trying to play it.
- `content-state-playback`: Content is playing.
- `content-state-buffering`: Content playback has begun and the player is buffering.
- `content-state-paused`: Content playback has been paused.
- `content-state-nextup`: Content is {playing,buffering} and the next up overlay is being shown.
- `app-state-error`: An error occured playing media, the application will try to recover by playing the next item in the queue or transition into `app-state-idle`. If the error is not recoverable, the app will exit.
- `ad-playback`: Ads are being played.

### State flags

The following flags can be used to modify state behavior:

- `flag-seek`: The user is seeking in media.
- `flag-user-inactive`: Flag set 5 seconds after the user controlled media for the last time.
- `flag-recoverable-error`: Flag set when an error is recoverable.
