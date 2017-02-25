var gulp = require('gulp');
var path = require('path');
var merge = require('merge-stream');

var libs = gulp.getFolders('bower_components');

const babelify = require('babelify');

var browserify = require('browserify');
var browserify_ngannotate = require('browserify-ngannotate');

var debowerify = require('debowerify');
var requireGlobify = require('require-globify');
var size = require('gulp-size');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var stringify = require('stringify');
var uglifyify = require('uglifyify');

gulp.task('dist-framework', [], function () {
    var frameworkBundle = getFrameworkBundle();
    return frameworkBundle
        .pipe(source('index.js'))
        .pipe(streamify(size({ title: "Size of framework: " })))
        .pipe(gulp.dest('dist/framework/'));
});

gulp.task('dist-vendors', [], function () {
    var b = browserify(
        {
            entries: './vendors-index.js',
            debug: false
        }
    ).transform(stringify(['.html']))
        .transform(debowerify);

    return b.bundle()
        .pipe(source('index.js'))
        .pipe(streamify(size({ title: "Size of vendors: " })))
        .pipe(gulp.dest('dist/vendors/'));
});

function getFrameworkBundle() {
    var framework = browserify({ entries: './client/app/app.module.js' })
        .transform(babelify, { sourceMapsAbsolute: true })
        .transform(stringify(['.html']))
        .transform(requireGlobify)
        .transform(debowerify);
    return framework.bundle();
}
