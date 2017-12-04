  'use strict';
  const webdriver = require('selenium-webdriver');
  const gm = require('gm').subClass({ imageMagick: true });
  const fs = require('fs');
  const path = require('path');
  const assert = require('assert');
  const By = webdriver.By;

  const url = 'https://pt-wrap01.wni.co.jp/Catalyst/'; // テスト対象ページ
  const currentDir = process.cwd();
  const pagePath = {
      acos: '#/introduction/acos?eventid=catalyst_test&testmap=olmap',
  }
  exports.test = function(driver, t) {
      function errorHandler(err) {
          throw err;
      }

      function mkdir(dir) {
          fs.access(dir, (err) => {
              if (err) {
                  fs.mkdirSync(dir);
              }
          });
      }

      function removeFile(filename) {
          fs.access(filename, (err) => {
              if (!err) {
                  fs.unlinkSync(filename);
              }
          });
      }
      // @func(common)
      const common = {
              // キャプチャの取得→画像比較処理
              saveScreenshot: (screenshotDir, masterScreenshotDir, title) => {
                  // スクリーンショット保存先
                  const screenShotFile = path.join(screenshotDir, `${title}.png`);
                  const masterScreenShotFile = path.join(masterScreenshotDir, `${title}.png`);
                  const diffScreenShotFile = path.join(screenshotDir, `${title}_diff.png`);
                  return new Promise((resolve, reject) => {
                      driver.saveScreenshot(screenShotFile)
                          .then(() => driver.cropImageByElement_safari(screenShotFile, screenShotFile, driver.findElement(By.id('map')))) // キャプチャをmapで切り抜いて上書き
                          .then(() => {
                              const options = {
                                  file: diffScreenShotFile,
                              };
                              return driver.compareImage(masterScreenShotFile, screenShotFile, options);
                          }).then((result) => {
                              if (result.equality === 0) {
                                  removeFile(diffScreenShotFile);
                              }
                              resolve(result);
                          }).catch((err) => {
                              reject(err);
                          });
                  });
              },
          }
          // @func_end
      t.describe('ACOSforVA', function() {
          const screenshotDir = path.join(currentDir, this.title);
          mkdir(screenshotDir);
          const masterScreenshotDir = path.join(currentDir, 'master', this.title);
          const tooltip_point = { x: 180, y: 180 };
          t.it('ACOSforVA_init', function(done) {
              driver.get('https://www.yahoo.co.jp')
                  .then(() => driver.get(url + pagePath.acos)) // @test acos画面取得
                  .then(() => driver.sleep(2000))
                  .then(() => driver.findElement(By.xpath('//body/div/div/div[2]/div/div/span/div/div/div/div')).click()) // @test acosのチェックボックスをクリック
                  .then(() => driver.sleep(1500))
                  .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャ取得
                  .then((result) => {
                      assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                      done();
                  })
                  .catch(errorHandler);
          });

          t.it('ACOSforVA_map_zoom_in', function(done) {
              driver.findElement(By.className('ol-zoom-in')).click() // @test ズームイン1回
                  .then(() => driver.sleep(1000))
                  .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャ取得
                  .then((result) => {
                      assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                      done();
                  })
                  .catch(errorHandler);
          });
          t.it('ACOSforVA_tooltip', function(done) {
              driver.actions().mouseMove(driver.findElement(By.id('map')), { x: tooltip_point.x, y: tooltip_point.y }).perform() // @test ツールチップ表示
                  .then(() => driver.sleep(500))
                  .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャ取得
                  .then((result) => {
                      assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                      done();
                  })
                  .catch(errorHandler);
          });
          t.it('ACOSforVA_map_zoom_out', function(done) {
              driver.findElement(By.className('ol-zoom-out')).click() // @test ズームアウト2回
                  .then(() => driver.findElement(By.className('ol-zoom-out')).click())
                  .then(() => driver.sleep(1000))
                  .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャ取得
                  .then((result) => {
                      assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                      done();
                  })
                  .catch(errorHandler);
          });
          t.it('ACOSforVA_map_slide', function(done) {
              driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 400, y: 0 }).mouseDown().mouseMove({ x: -200, y: 0 }).perform() // @test 
                  .then(() => driver.sleep(500)) //ドラッグ時の慣性をなくすため　
                  .then(() => driver.actions().mouseUp().perform())
                  .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 0, y: 0 }).mouseDown().mouseMove({ x: 0, y: 200 }).perform()) // @test 
                  .then(() => driver.sleep(500)) //ドラッグ時の慣性をなくすため　
                  .then(() => driver.actions().mouseUp().perform())
                  .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 0, y: 0 }).mouseDown().mouseMove({ x: 0, y: 200 }).perform()) // @test 
                  .then(() => driver.sleep(500)) //ドラッグ時の慣性をなくすため　
                  .then(() => driver.actions().mouseUp().perform())
                  .then(() => driver.sleep(1000))
                  .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャ取得
                  .then((result) => {
                      assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                  })
                  .then(() => { done(); })
                  .catch(errorHandler);
          });
      });
  }