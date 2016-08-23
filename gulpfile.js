

// -----------------------------------------------
//
//   A not-so-simple gulpfile.
//   Based on: https://github.com/drewbarontini/noise
//
// -----------------------------------------------
//
//   ToDo:
// - linting
// - gzip (https://github.com/jstuckey/gulp-gzip)
// - zopfli gzip (eg. pngs) (https://github.com/romeovs/gulp-zopfli)
//
// -----------------------------------------------


var gulp    = require( 'gulp' );
// var run     = require( 'run-sequence' );
var plugins = require( 'gulp-load-plugins' )( {
	lazy: true,
	rename : {
		'gulp-sass-lint'   : 'sasslint',
		'gulp-svg-symbols' : 'svgsymbols',
		'psi'              : 'pagespeedindex'
	}

} );


// -----------------------------------------------
//   Options
// -----------------------------------------------

var options = {

	default : {
		tasks : [ 'build', 'watch' ]
	},

	build : {
		tasks       : [ 'images', 'compile:sass', 'minify:js'],
		destination : 'build/'
	},

	production : {
		tasks : [ 'build', 'minify:css' ]
	},

	css : {
		files       : 'assets/stylesheets/*.css',
		file        : 'assets/stylesheets/application.css'
	},

	fonts : {
		files       : 'assets/fonts/*.{otf,ttf,eot,woff,woff2,svg}',
		destination : 'build/fonts'
	},

	icons : {
		files       : 'assets/icons/ic-*.svg',
		destination : 'build/icons'
	},

	images : {
		files       : 'assets/images-src/*',
		destination : 'assets/images'
	},

	js : {
		// files       : 'assets/scripts/*.js',
		files : [
			'node_modules/fontfaceonload/dist/fontfaceonload.js',
			'assets/javascripts/*.js'
		],
		file        : 'assets/javascripts/application.js'
	},

	pagespeedindex : {
		site        : '',
		key         : ''
	},

	sass : {
		files       : 'assets/stylesheets/*.scss',
		destination : 'assets/stylesheets/'
	},

	watch : {
		files : function() {
			return [
				options.images.files,
				options.js.files,
				options.sass.files
			]
		},
		run : function() {
			return [
				[ 'images' ],
				[ 'minify:js' ],
				// [ 'compile:sass', 'minify:css' ]
				[ 'compile:sass' ]
			]
		}
	}
}


// -----------------------------------------------
//   Tasks
// -----------------------------------------------

gulp.task( 'default', options.default.tasks );

gulp.task( 'build', function() {
	options.build.tasks.forEach( function( task ) {
		gulp.start( task );
	} );
});

gulp.task( 'production', options.production.tasks );

gulp.task( 'fonts', function() {
	gulp.src( options.fonts.files )
		.pipe( gulp.dest( options.fonts.destination ) )
		.pipe( plugins.size({title: 'fonts'}) );
});

gulp.task( 'images', function() {
	gulp.src( options.images.files )
		// .pipe( plugins.cache( plugins.imagemin({ })))
		.pipe( plugins.imagemin({
			progressive: true,
			interlaced: true
		}))
		.pipe( gulp.dest( options.images.destination ) )
		.pipe( plugins.size({title: 'images'}) );
});

gulp.task( 'compile:sass', function() {
	gulp.src( options.sass.files )
		.pipe( plugins.plumber() )
		.pipe( plugins.sourcemaps.init() )
		// .pipe( plugins.sass().on('error', sass.logError))
		.pipe( plugins.sass( {
			indentedSyntax: true,
			// errLogToConsole: true
		} ) )
		.pipe( plugins.autoprefixer( {
                // http://www.analog-ni.co/my-css-autoprefixer-settings-for-ie9-and-up
                browsers: [
                    'last 2 versions',
                    'Explorer >= 9',
                    'iOS >= 5',
                    'Safari >= 5',
                    'OperaMobile >= 11',
                    'ChromeAndroid >= 9',
                    'ExplorerMobile >= 9'
                ],
				cascade  : false
		} ) )
		.pipe( plugins.sourcemaps.write() )
		.pipe( gulp.dest( options.sass.destination ) )
		.pipe( plugins.size({title: 'styles'}) )
		.pipe( plugins.connect.reload() );
});

// from W6…
// gulp.task( 'compile:css', function() {
//     return gulp
//         .src(output.css + '/*.css')
//         .pipe(order([
//             "vendor.css",
//             "flickity.css",
//             "styles.css"
//         ]))
//         .pipe(concat('styles.min.css'))
//         .pipe(cssNano(nanoOptions))
//         .pipe(gulp.dest(output.css))
// });

gulp.task( 'minify:css', function () {
	gulp.src( options.css.file )
		.pipe( plugins.plumber() )
		.pipe( plugins.uncss ( {
			html: [
				'_includes/*.html',
				'_layouts/*.html',
				'/blog/*.html',
				'/info-for/*.html',
				'*.html'
			],
			uncssrc: '.uncssrc'
		} ) )
		.pipe( plugins.cssnano( { advanced: false } ) )
		.pipe( plugins.rename( { suffix: '.min' } ) )
		.pipe( gulp.dest( options.build.destination ) )
		.pipe( plugins.size({title: 'styles'}) )
		.pipe( plugins.connect.reload() );
});

gulp.task( 'minify:js', function () {
	gulp.src( options.js.files )
		.pipe( plugins.plumber() )
		.pipe( plugins.concat('application.js') )
		.pipe( plugins.uglify() )
		.pipe( plugins.rename( { suffix: '.min' } ) )
		.pipe( gulp.dest( options.build.destination ) )
		.pipe( plugins.connect.reload() );
});

// Creates SVG sprite and demo page.
// Alt: https://github.com/Hiswe/gulp-svg-symbols & OUI

gulp.task( 'icons', function() {
	gulp.src( options.icons.files )
		.pipe( plugins.svgmin() )
		.pipe( plugins.svgstore( { inlineSvg: true } ) )
		.pipe( gulp.dest( options.icons.destination ) );
});

// PageSpeed tests using the `nokey` option.
// See: https://github.com/addyosmani/psi-gulp-sample/blob/master/gulpfile.js

gulp.task('psiMobile', function () {
	return plugins.psi( options.pagespeedindex.site, {
		// key: key
		nokey: 'true',
		strategy: 'mobile',
	}).then(function (data) {
		console.log('Speed score: ' + data.ruleGroups.SPEED.score);
		console.log('Usability score: ' + data.ruleGroups.USABILITY.score);
	});
});

gulp.task('psiDesktop', function () {
	return plugins.psi( options.pagespeedindex.site, {
		// key: key,
		nokey: 'true',
		strategy: 'desktop',
	}).then(function (data) {
		console.log('Speed score: ' + data.ruleGroups.SPEED.score);
	});
});

gulp.task( 'watch', function() {
	var watchFiles = options.watch.files();
	watchFiles.forEach( function( files, index ) {
		gulp.watch( files, options.watch.run()[ index ]  );
	} );
});
