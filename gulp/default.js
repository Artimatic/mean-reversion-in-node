var gulp = require('gulp');
var runSequence = require('run-sequence');

gulp.task('default', function() {
    runSequence(
        'clean',
        [
            'dist-main',
            'sass-framework'
        ],
        'start-server',
        'watch');
});
