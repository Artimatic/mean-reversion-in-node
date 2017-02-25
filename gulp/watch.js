var gulp = require('gulp');
var _ = require('lodash');

var appFw = [
    'client/app/**/**/*.js',
    'client/app/**/**/*.html',
    'client/components/**/*.js',
    'client/components/**/*.html',
    'client/*.html',

    '!client/app/**/**/*-spec.js',
    '!client/components/**/*-spec.js'
];

var scssFramework = [
    'client/styles/main.scss',
    'client/app/**/**/*.scss',
    'client/components/**/*.scss'
];

var vendors = [
    "vendors-index.js"
];

var distFiles = ['dist/**/*', 'index.html'];
var livereload = require('gulp-livereload');

var reload = _.debounce(function() {
    livereload.reload();
}, 500);

gulp.task('live-reload', function () {
    reload();
});

gulp.task('watch', function () {
    livereload.listen();
    gulp.watch(appFw, ['dist-framework']);
    gulp.watch(scssFramework, ['sass-framework']);
    gulp.watch(distFiles, ['live-reload']);
    gulp.watch(vendors, ['live-reload']);
});


module.exports = {
   appFw : appFw,
   distFiles: distFiles
};
