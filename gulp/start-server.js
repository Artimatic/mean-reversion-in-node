var gulp = require('gulp');
var nodemon = require('gulp-nodemon');


gulp.task('start-server', function () {
    nodemon({
        script: 'server/app.js',
        ext: 'json js',
        watch: ['server/']
    });
});
