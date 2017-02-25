var jshint = require('gulp-jshint');
var gulp   = require('gulp');

gulp.task('jshint:framework', function() {
    return gulp.src(['./framework_components/**/*.js', './pages/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish')).pipe(jshint.reporter('fail'));
});

gulp.task('jshint',['jshint:framework']);
