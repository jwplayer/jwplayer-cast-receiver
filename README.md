# JW Player Custom Chromecast Receiver

## Building the Receiver

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

For debug builds, the build script will try to copy jwplayer.js (and assets) from `../../jwplayer-commercial/bin-debug/`.
If this fails, the script will build against a player on the CDN, the version of the player it builds against is defined in the build script.

## Setting Up the Receiver

### Receiver Application URL

There are two options to build the Receiver Application URL.

#### Using a JW Player Key

1. Build and serve the receiver on a secure server that supports **HTTPS** (i.e. `https://domain.com/receiver`)
2. [URI Encode](http://meyerweb.com/eric/tools/dencoder/) your JW Player Key (i.e. `A1jqZjIUo28r0w==` becomes `A1jqZjIUo28r0w%3D%3D`)
3. The URL is then `https://domain.com/receiver?key=A1jqZjIUo28r0w%3D%3D`
4. To verify it is setup correct, load the URL in the browser, which will display a page with a spinner in the middle

**Note:** You will not be able to customize the appearance of the receiver with this method

#### Using a Configuration File

1. Build and serve the receiver on a secure server that supports **HTTPS** (i.e. `https://domain.com/receiver`)
2. In the `config` folder, rename the `sample` directory to the application name you would like to use
3. Update `config/{directoryName}/config.json` in the directory with the desired config values
3. The URL is then `https://domain.com/receiver?appName={directoryName}`
4. To verify it is setup correct, load the URL in the browser, which will display a page with a spinner in the middle

### Receiver Application ID

1. Sign in to the [Google Cast SDK Developer Console](https://cast.google.com/u/0/publish/#/signup)
2. [Register](https://developers.google.com/cast/docs/registration) your Custom Receiver URL to obtain an application ID 

### Setting up JW Player

#### Web Application

To support custom receivers, you will need to provide the Application ID in the configuration of your player

```
{ file: "bbbuunny.mp4",
  cast: {
    customAppId: "Your Application ID"
  }
}
```  
#### Mobile Applications

In the `senders` directory, there are sample native apps (Android and iOS) that support the custom receiver.

### Release

To test your receiver, you need to register the serial number of any Chromecast test devices. Once it is ready to be published,
go into the console and go through the publishing process.

For testing purposes, you will need to register the receiver at the [Google Cast SDK Developer Console
](https://cast.google.com/u/0/publish/#/signup) to obtain an Application ID. 
The receiver will use the `appName` from the search portion of the receiver URL in order to load the config file.
So when for example your appName is `cast-test` you need to register the following receiver URL with Google: `https://path-to-receiver?appName=cast-test`.

## Customization of the Receiver

### Basic

In you are using a configuration file to create an Application ID, you are currently able set some basic customizations to the receiver in addition to the JW Player Key (see `config/sample/config.json` as an example):
- `title`: The title of the HTML page
- `logoUrl`: The path to a logo that will be displayed when idle or loading
- `theme`: Two themes are currently available, `light` and `dark`

You can use multiple config directories and then have multiple receiver URLs. This allows you support different styled receivers using only one instance on your server.

### Advanced

If your are not using the configuration file or would like to perform more customizations, here are some classes that are available to be styles:

- `app-state-loading`: The application is loading.
- `app-state-idle`: The application has been loaded and content can be Cast.
- `content-state-loading`: Content has been cast, and the application is trying to play it.
- `content-state-playback`: Content is playing.
- `content-state-buffering`: Content playback has begun and the player is buffering.
- `content-state-paused`: Content playback has been paused.
- `content-state-nextup`: Content is {playing,buffering} and the next up overlay is being shown.
- `app-state-error`: An error occured playing media, the application will try to recover by playing the next item in the queue or transition into `app-state-idle`. If the error is not recoverable, the app will exit.
- `ad-playback`: Ads are being played.

The following flags can be used to modify state behavior:

- `flag-seek`: The user is seeking in media.
- `flag-user-inactive`: Flag set 5 seconds after the user controlled media for the last time.
- `flag-recoverable-error`: Flag set when an error is recoverable.

### Features

- DRM are supported(Widevine/PlayReady)
- VAST 3.0 and Google IMA Pre-roll ads are supported only in Android/iOS sender apps
- Ad skipping and ad click-through are not supported
- DASH/WEBM VP9 streams are not supported
