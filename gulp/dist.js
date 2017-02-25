var gulp = require('gulp');
var runSequence = require('run-sequence');

gulp.task('dist-main', function () {
    runSequence(
        'clean',
        [
            'dist-framework',
            'dist-vendors'
        ]
    );
});
