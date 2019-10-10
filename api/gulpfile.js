const { series, src, dest } = require('gulp');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');

function defaultTask(cb) {
  // place code for your default task here
  console.log('hello');
  cb();
}

function copyJSON(cb) {
  cb();
  return src('./src/**/*.json').pipe(dest('./dist/'));
}

function tsc(cb) {
  cb();
  return tsProject
    .src()
    .pipe(tsProject())
    .js.pipe(dest('dist'));
}

exports.default = series(tsc, copyJSON);
