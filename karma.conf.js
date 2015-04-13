module.exports = function (config) {
   config.set({
      basePath: './',
      files: [
         'public_html/js/vg/*.js'
      ],
      autoWatch: true,
      frameworks: ['jasmine'],
      browsers: ['Chrome'],
      plugins: [
         'karma-chrome-launcher',
         'karma-firefox-launcher',
         'karma-jasmine',
         'karma-qunit',
         'karma-junit-reporter'
      ],
      junitReporter: {
         outputFile: 'test_out/unit.xml',
         suite: 'unit'
      }
   });
};
