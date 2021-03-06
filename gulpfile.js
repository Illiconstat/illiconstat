var browserify = require('browserify');
var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var Server = require('karma').Server;
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var argv = require('yargs').argv;

var cordovaPlatforms = require('./package.json').cordovaPlatforms;

var paths = {
    sass: ['./scss/**/*.scss']
};

gulp.task('default', ['sass']);

gulp.task('sass', function (done) {
    gulp.src('./scss/*.scss')
        .pipe(sass())
        .on('error', sass.logError)
        .pipe(gulp.dest('./www/css/'))
        .pipe(minifyCss({
                            keepSpecialComments: 0
                        }))
        .pipe(rename({extname: '.min.css'}))
        .pipe(gulp.dest('./www/css/'))
        .on('end', done);
});

gulp.task('browserify', function () {
    browserify().require('nools')
                .bundle()
                .pipe(source('browserify-bundle.js'))
                .pipe(buffer())
                .pipe(uglify())
                .pipe(gulp.dest('./www/lib/'));
});

gulp.task('watch', function () {
    gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function () {
    return bower.commands.install()
                .on('log', function (data) {
                    gutil.log('bower', gutil.colors.cyan(data.id), data.message);
                });
});

gulp.task('git-check', function (done) {
    if (!sh.which('git')) {
        console.log(
            '  ' + gutil.colors.red('Git is not installed.'),
            '\n  Git, the version control system, is required to download Ionic.',
            '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
            '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
        );
        process.exit(1);
    }
    done();
});

gulp.task('test', ['browserify'], function (done) {
    new Server({
        configFile: __dirname + '/config/karma.conf.js',
        singleRun: true
    }, done).start();
});

gulp.task('serve', ['browserify', 'sass'], function () {
    sh.exec('ionic serve');
});

gulp.task('install:platforms', function () {
    cordovaPlatforms.forEach(function (platform) {
        gutil.log('Installing platform ' + platform + '...');
        var exec = sh.exec('cordova platform add ' + platform, {silent:true});
        if (exec !== 0) {
            gutil.log('Platform ' + platform + ' has already been added.');
        }
    });
});

gulp.task('emulate', ['install:platforms', 'browserify', 'sass'], function () {
    var platform = argv.platform;
    if (!platform) {
        throw new Error('Platform should be provided when trying to emulate. Have a look at the README.');
    }
    sh.exec('ionic emulate ' + platform);
});
