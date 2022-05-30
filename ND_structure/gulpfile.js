//для составления сборки использовалась документация галпа и документация отдельных пакетов
const {	src,	dest,	series,	parallel,	watch} = require('gulp'),
	gulp = require('gulp'),
	sass = require('gulp-sass')(require('sass')),
	sourcemaps  =  require ( 'gulp-sourcemaps' ),
	rename  = require ('gulp-rename'),
	autoprefixer  =  require ('gulp-autoprefixer'),
	browserSync = require('browser-sync').create(),
	htmlmin = require('gulp-htmlmin'),
	fileinclude = require('gulp-file-include'),
	imagemin = require ('gulp-imagemin'),
	webp = require('gulp-webp'),
	del = require('del'),
	webpack = require('webpack-stream'),
	gulpif = require('gulp-if');

//путь (для гибкости)
  const dist = './dist/';
/* const dist = 'C:/OpenServer/domains/test.now/'; */


//ручной тумблер (благодаря gulp-if)
const isProd = false;

//del
async function deleteDist(){
	if(isProd){
		const kill = await del(dist);
	}
}

//styles
function styles() {
	//говорим ниже, что будем работать либо с scss|sass|css расширением
	return gulp.src('./src/scss/**/*.+(scss|sass|css)')
	.pipe(gulpif(!isProd, sourcemaps.init()))
	.pipe(sass.sync({outputStyle: 'compressed'}).on('error', sass.logError))
	.pipe(rename({extname: ".min.css"}))
	.pipe(autoprefixer({cascade: false}))
	.pipe(gulpif(!isProd, sourcemaps.write('./')))
	.pipe(gulp.dest(`${dist}css`))
 	.pipe(browserSync.stream());
}
//html
function html(){
	return gulp.src('./src/*.html')
	.pipe(fileinclude({prefix: '@@', basepath: '@file'}))
	.pipe(htmlmin({ collapseWhitespace: true }))
	.pipe(gulp.dest(dist))
	.pipe(browserSync.stream());
}

//toWebP(PNG, JPEG, TIFF, WebP) && imagemin(PNG, JPEG, GIF and SVG)
function images(){
	return gulp.src('./src/img/**/*.*')
	.pipe(imagemin())
	.pipe(gulp.dest(`${dist}img`))
	.pipe(webp())
	.pipe(gulp.dest(`${dist}img`))
	.pipe(browserSync.stream());
}

//assets
function elseAssets(){
	return gulp.src('./src/assets/**/*.*')
	.pipe(gulp.dest(`${dist}assets`))
	.pipe(browserSync.stream());
}

//javascript - здесь у нас работает эмулятор вебпака (импортирует модули), и уже в самом вебпаке мы подключаем транспилятор бабел, который использует новейшую версию библиотеки core js для полифилизации
function js(){
	return gulp.src('./src/js/main.js')
    .pipe(webpack({
		mode: isProd ? 'production' : 'development',
		output: {
			filename: 'script.js',
		  },
		devtool: isProd ? false : 'source-map',
		module: {
			rules: [
			  {
				test: /\.m?js$/,
				exclude: /(node_modules|bower_components)/,
				use: {
				  loader: 'babel-loader',
				  options: {
					presets: [['@babel/preset-env', {
						corejs: 3.22,
						useBuiltIns: "usage"
					}]]
				  }
				}
			  }
			]
		  }
	}))
    .pipe(gulp.dest(`${dist}js`))
	.pipe(browserSync.stream());
}



//watching and doing and reload
//каждый раз, когда фиксируется изменение с указанными файлами - происходит вызов функции, которая совершает операции и перезагружает страницу в браузере
function watchingForChanges(){
	browserSync.init({
		server: {
			baseDir: dist
		}
	});
	gulp.watch('./src/scss/**/*.+(scss|sass)', styles);
	gulp.watch('./src/**/*.html', html);
	gulp.watch('./src/img/**/*.*', images);
	gulp.watch('./src/assets/**/*.*', elseAssets);
	gulp.watch('./src/js/**/*.js', js);

}



//exports.default = deleteDist;
exports.default = series(deleteDist, html, styles, images, elseAssets, js, watchingForChanges);
