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
    amedas: '#/introduction/amedas?eventid=catalyst_test&testmap=olmap',
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
    const sample_time = 16;
    const sample_time_Precipitation = 206;

    t.describe('AMeDAS', function() {
        const screenshotDir = path.join(currentDir, this.title);
        mkdir(screenshotDir);
        const masterScreenshotDir = path.join(currentDir, 'master', this.title);

        t.it('AMeDAS_Sunshine_on', function(done) {
            driver.get(url + pagePath.amedas)
                .then(() => driver.wait(webdriver.until.elementLocated(By.className('gm-style')), 3000))
                .then(() => driver.sleep(2000))
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/span/div/div/div/div[1]')).click()) // @test AMeDASをON（SunshineをON）
                .then(() => driver.sleep(3000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('AMeDAS_Temperature_on', function(done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/span/div/div/div/div[3]/div[2]/div[2]')).click() // @test TemperatureをON
                .then(() => driver.sleep(4000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('AMeDAS_Precipitation_on', function(done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/span/div/div/div/div[3]/div[2]/div[3]')).click() // @test PrecipitationをON
                .then(() => driver.sleep(3000))
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/span/div/div/div/div[2]/div[1]')).click()) // @test Validtimeを開く
                .then(() => driver.sleep(1000))
                .then(() => driver.findElement(By.xpath(`/html/body/div[2]/div/div/div/div[${sample_time_Precipitation}]/span/div/div/div`)).click()) // @test Validtimeを変更
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('AMeDAS_SnowDepth_on', function(done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/span/div/div/div/div[3]/div[2]/div[4]')).click() // @test Snow depthをON
                .then(() => driver.sleep(3000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });


        t.it('AMeDAS_Wind_on', function(done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/span/div/div/div/div[3]/div[1]')).click() // @test WindをON
                .then(() => driver.sleep(4000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('AMeDAS_validtime_change', function(done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/span/div/div/div/div[3]/div[2]/div[2]')).click() // @test SunshineをON
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/span/div/div/div/div[3]/div[1]')).click()) // @test WindをOFF
                .then(() => driver.sleep(2000))
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/span/div/div/div/div[2]/div[1]')).click()) // @test Validtimeを開く
                .then(() => driver.sleep(1000))
                .then(() => driver.findElement(By.xpath(`/html/body/div[2]/div/div/div/div[${sample_time}]/span/div/div/div`)).click()) // @test Validtimeを変更
                .then(() => driver.sleep(4000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('AMeDAS_zoom_out', function(done) {
            driver.findElement(By.className('ol-zoom-out')).click() // @test mapズームアウト
                .then(() => driver.sleep(4000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('AMeDAS_zoom_in', function(done) {
            driver.findElement(By.className('ol-zoom-in')).click() // @test mapズームイン
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()) // @test mapズームイン
                .then(() => driver.sleep(4000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('AMeDAS_tooltip', function(done) {
            driver.findElement(By.className('ol-zoom-out')).click() // @test mapズームアウト
                .then(() => driver.sleep(1000))
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 180, y: 160 }).mouseMove({ x: 20, y: 20 }).perform()) // @test ツールチップ表示
                .then(() => driver.sleep(1000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('AMeDAS_move_area', function(done) {
            driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 200, y: 0 }).mouseDown()
                .mouseMove({ x: -200, y: 450 }).perform() // @test mapを移動
                .then(() => driver.sleep(400)) //ドラッグ時の慣性をなくすため
                .then(() => driver.actions().mouseUp().perform())
                .then(() => driver.sleep(1000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                }).catch(errorHandler);
        });
    });
}