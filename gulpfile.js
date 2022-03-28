'use strict';

let gulp = require('gulp');
let connect = require('gulp-connect');
let mustache = require('gulp-mustache');
let less = require('gulp-less');
let rollup = require('rollup');
let uglify = require('rollup-plugin-uglify');
let del = require('del');
let child_process = require('child_process');
let fs = require('fs');

const DEST_DEBUG = 'bin-debug/';
const DEST_RELEASE = 'bin-release/';

// The jwplayer.js version we are targeting.
const PLAYER_VERSION = '8.24.4';

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
            jwplayer: useDebugPlayer ? 'libs/jwplayer.js' : `//ssl.p.jwpcdn.com/player/v/${PLAYER_VERSION}/jwplayer.js`
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
        plugins.push(uglify.uglify());
    }

    // Rollup JS
    return rollup.rollup({
            input: './src/js/main.js',
            plugins: plugins,
        }).then((bundle) => {
            return bundle.write({
            //sourceMap: target != 'release',
            file: `./${DEST}/app.js`,
            name: 'JWCast',
            format: 'iife',
            globals: {
                jwplayer: 'jwplayer',
                cast: 'cast',
                google: 'google'
            }
        });
    });
}

// Serves bin-debug/ and config/ at localhost:8080.
gulp.task('serve', (cb) => {
    connect.server({
        root: ['bin-debug', 'config'],
        port: 8080,
        livereload: true,
        name: 'Custom Receiver' 
    });

    cb();
});

// Cleanup task, deletes bin-debug and bin-release.
gulp.task('clean', () => { 
    return del(['bin-debug', 'bin-release']);
});

// Delete bin-debug
gulp.task('clean-debug', () => { 
    return del(['bin-debug']);
});

// Delete bin-release
gulp.task('clean-release', () => { 
    return del(['bin-release']);
});

// Builds a debug package.
gulp.task('build:debug', gulp.series('clean-debug', () => { return buildTarget('debug') }));

// Builds a release package.
gulp.task('build:release', gulp.series('clean-release', () => { return buildTarget('release') }));

// Builds a debug and a release package.
gulp.task('build', gulp.series('build:debug', 'build:release'));

// Watch task: will recompile when changes have been detected.
gulp.task('watch', () => {
    return gulp.watch(['src/**/*.js', 'src/*.html', 'src/style/**/*.less'], gulp.series('build'));
});

// Task invoked when gulp is being executed without parameters.
gulp.task('default', gulp.series('build'));

// Development task: serves bin-debug and watches for changes.
gulp.task('dev', gulp.series('serve', 'watch'));
