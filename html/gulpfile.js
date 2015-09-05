var gulp = require('gulp');
var browserify = require('browserify');
var fs = require('fs');
var del = require('del');
var babelify = require('babelify');
var sass = require('gulp-sass');

gulp.task('app', ['clean'], function() {
	return browserify('./src/main.js')
	.transform(babelify.configure({
		optional: ["es7"]			     
	}))
	.external(require.resolve('react'))
	.external(require.resolve('react-router'))
	.external(require.resolve('flux-react'))
	.external(require.resolve('moment'))
	.external(require.resolve('underscore'))
	.external(require.resolve('react-lazy-load'))
	.external(require.resolve('react/addons'))
	.bundle(function(err, app) {
		fs.writeFile('./www/js/app.js', app);
	});
});

gulp.task('common', function() {
	del(['./www/js/common.js']);
	return browserify()
	.require(require.resolve('react'), { expose: 'react' })
	.require(require.resolve('react-router'), { expose: 'react-router' })
	.require(require.resolve('react/addons'), { expose: 'react/addons' })
	.require(require.resolve('flux-react'), { expose: 'flux-react' })
	.require(require.resolve('moment'), { expose: 'moment' })
	.require(require.resolve('react-lazy-load'), { expose: 'react-lazy-load' })
	.require(require.resolve('underscore'), { expose: 'underscore' })
	.bundle(function(err, libs) {
		fs.writeFile('./www/js/common.js', libs);
	});
});

gulp.task('sass', function () {
	gulp.src('./sass/**/*.scss')
	.pipe(sass().on('error', sass.logError))
	.pipe(gulp.dest('./www/css'));
});
 
gulp.task('clean', function(done) {
	del(['./www/js/app.js'], done);
});

gulp.task('watch', function() {
	gulp.watch('./src/**/*.js', ['app']);
	gulp.watch('./sass/**/*.scss', ['sass']);
});

gulp.task('default', ['watch', 'app', 'common', 'sass']);
