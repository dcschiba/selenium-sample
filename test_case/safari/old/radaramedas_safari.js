'use strict';
const webdriver = require('selenium-webdriver');
const gm = require('gm').subClass({ imageMagick: true });
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const By = webdriver.By;

//const url = 'https://pt-wrap01.wni.co.jp/Catalyst/'; // テスト対象ページ
const url = 'https://pt-wrap01.wni.co.jp/Catalyst/'; // テスト対象ページ
const currentDir = process.cwd();
const pagePath = {
    radaramedas: '#/introduction/radaramedas?eventid=catalyst_test&testmap=olmap',
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
    const sample_time = 8;
    t.describe('RadarAmedas', function() {
        const screenshotDir = path.join(currentDir, this.title);
        mkdir(screenshotDir);
        const masterScreenshotDir = path.join(currentDir, 'master', this.title);

        t.it('RadarAmedas_show_RadarAmedas', function(done) {
            driver.get(url + pagePath.radaramedas) // @test ページを表示
                .then(() => driver.sleep(2000))
                .then(() => driver.findElement(By.xpath('//body/div/div/div[2]/div/div/span/div/div/div/div/div[1]/div/div')).click()) // @test 機能ON
                .then(() => driver.sleep(3000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('RadarAmedas_move_area', function(done) {
            driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 0, y: 200 }).mouseDown()
                .mouseMove({ x: 200, y: -200 }).perform() // @test マップをスライド(右上に移動)
                .then(() => driver.sleep(400)) //ドラッグ時の慣性をなくすため
                .then(() => driver.actions().mouseUp().perform())
                .then(() => driver.sleep(1000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                }).catch(errorHandler);
        });

        t.it('RadarAmedas_show_validtime_change_data', function(done) {
            driver.executeScript(`
            var element = document.querySelector('#root > div > div:nth-child(2) > div > div > span > div > div > div > div > div:nth-child(2) > div > select');
            element.value = element.querySelector('option:nth-child(${sample_time})').value;
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent('change', true, true);
            element.dispatchEvent(evt);
            `) // @test 過去データを選択
                .then(() => driver.sleep(4000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('RadarAmedas_map_zoom_out', function(done) {
            driver.findElement(By.className('ol-zoom-out')).click() // @testズームアウト
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('RadarAmedas_map_zoom_in', function(done) {
            driver.findElement(By.className('ol-zoom-in')).click() // @test ズームイン×2
                .then(() => driver.findElement(By.className('ol-zoom-in')).click())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
    });
}