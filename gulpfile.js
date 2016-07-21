var gulp = require('gulp'),
    livereload = require('gulp-livereload');
var exec = require('child_process').exec;
gulp.task('livereload', function() {
  setTimeout(function(){
    livereload.reload();
  },150)
      
});


gulp.task('watch', function() {
  livereload.listen();
  gulp.watch(['./front_app/**/*'], ['livereload']);
});