var gulp = require('gulp');
var uglify = require('gulp-uglify');
var connect = require('gulp-connect');
var rename = require('gulp-rename');
var open = require('open');

var port = 8001;

gulp.task('uglify', function() {
    return gulp.src('src/**.js')
        // minify the js files
        .pipe(uglify({
            preserveComments: 'some'
        }))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('dist/'));
});

gulp.task('copy', function() {
    return gulp.src('src/**.{js,css}')
        .pipe(gulp.dest('dist/'))
});


// start a development server
gulp.task('serve', function () {
  connect.server({
    port: port,
    livereload: true
  });
  return true;
});

gulp.task('test', ['serve'], function() {
    open('http://localhost:' + port + '/test');


    var files = ['test/**/*.js', 'src/**/*.{js,css}'];

    gulp.watch(files, function () {

        gulp.src(files)
            .pipe(connect.reload());
    });
});

gulp.task('build', ['uglify', 'copy']);

