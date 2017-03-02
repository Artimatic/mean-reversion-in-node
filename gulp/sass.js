var gulp = require('gulp');
var sass = require('gulp-sass');
var stylesMainPath = './client/styles/main.scss';

gulp.task('sass-framework', function () {
    return gulp.src(stylesMainPath)
        .pipe(sass())
        .pipe(gulp.dest('dist/css/'));
});
