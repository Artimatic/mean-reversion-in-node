'use strict';

var gulp = require('gulp');
var fs = require('fs');
var path = require('path');

function getFolders(dir) {
    return fs.readdirSync(dir)
        .filter(function (file) {
            return fs.statSync(path.join(dir, file)).isDirectory();
        });
}

gulp.getFolders = getFolders;

require('require-dir')('./gulp/');
