'use strict';

let gulp = require('gulp');
let connect = require('gulp-connect');
let mustache = require('gulp-mustache');
let less = require('gulp-less');
let rollup = require('rollup');
let minifier = require('uglify-js').minify;
let uglify = require('rollup-plugin-uglify');
let del = require('del');
let child_process = require('child_process');
let fs = require('fs');

const DEST_DEBUG = 'bin-debug/';
const DEST_RELEASE = 'bin-release/';

// The jwplayer.js version we are targeting.
const PLAYER_VERSION = '7.8.7';

function buildTarget(target) {
  const DEST = target == 'debug' ? DEST_DEBUG : DEST_RELEASE;

  // Create destination dir if not exists.
  // mkdir -p will create intermediate directories as required.
  child_process.exec('mkdir -p ' + DEST + 'assets/');

  let useDebugPlayer = false;
  if (target === 'debug') {
    try {
      // Check if we can copy the player from ../jwplayer-commercial/bin-debug/
      fs.accessSync('../jwplayer-commercial/bin-debug/');
      useDebugPlayer = true;
    } catch (err) {
      console.warn('Debuggable player not found: Building against CDN player.');
    }
  }

  if (useDebugPlayer) {
    // Copy debug player.
    child_process.exec('mkdir -p ' + DEST + 'libs/');
    child_process.exec('cp -R ../jwplayer-commercial/bin-debug/ ' + DEST + 'libs/');
  }

  // Copy assets
  child_process.exec('cp -r src/assets/* ' + DEST + 'assets/');

  // Render HTML
  gulp.src('./src/*.html')
    .pipe(mustache({
      jwplayer: useDebugPlayer ? 'libs/jwplayer.js' : `//p.jwpcdn.com/player/v/${PLAYER_VERSION}/jwplayer.js`
    }))
    .pipe(gulp.dest(DEST));

  // Render LESS
  gulp.src('./src/style/**/*.less')
    .pipe(less({
      compress: target == 'release'
    }))
    .pipe(gulp.dest(DEST + 'css/'));

  // Minify release builds
  let plugins = [];
  if (target == 'release') {
    plugins.push(uglify({}, minifier));
  }

  // Rollup JS
  return rollup.rollup({
    entry: 'src/js/main.js',
    plugins: plugins,
    globals: {
      jwplayer: 'jwplayer',
      cast: 'cast',
      google: 'google'
    }
  }).then((bundle) => {
    bundle.write({
      //sourceMap: target != 'release',
      dest: DEST + 'app.js',
      format: 'iife',
      moduleName: 'JWCast'
    });
  });
}

// Serves bin-debug/ and config/ at localhost:8080.
gulp.task('serve', () => {
  connect.server({
    root: ['bin-debug', 'config'],
    port: 8080
  });
});

// Cleanup task, deletes bin-debug and bin-release.
gulp.task('clean', () => { return del(['bin-debug/', 'bin-release/']) });

// Watch task: will recompile when changes have been detected.
gulp.task('watch', ['clean', 'build'], () => {
  gulp.watch(['src/**/*.js', 'src/*.html', 'src/style/**/*.less'], ['build']);
});

// Task invoked when gulp is being executed without parameters.
gulp.task('default', ['build']);

// Builds a debug and a release package.
gulp.task('build', ['clean', 'build:debug', 'build:release']);

// Builds a debug package.
gulp.task('build:debug', ['clean'], () => { return buildTarget('debug') });

// Builds a release package.
gulp.task('build:release', ['clean'], () => { return buildTarget('release') });

// Development task: serves bin-debug and watches for changes.
gulp.task('dev', ['watch', 'serve']);
