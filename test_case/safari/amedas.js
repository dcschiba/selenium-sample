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
exports.test = function (driver, t) {
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
                    .then(() => driver.cropImageByElement(screenShotFile, screenShotFile, driver.findElement(By.id('map')))) // キャプチャをmapで切り抜いて上書き
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
        checkstatus: () => {
            return new Promise((resolve, reject) => {
                driver.executeScript('return window.startWaitLayerDraw()')
                    .then((bflayerstatus) => {
                        let i = 0;
                        const inte = setInterval(() => {
                            driver.executeScript('return window.getLayerstatus()').then((layerstatus) => {
                                if ((layerstatus
                                    && layerstatus.error === 0
                                    && layerstatus.incompleted === 0) || i > 25) {
                                    resolve(layerstatus);
                                    clearInterval(inte);
                                }
                            });
                            i += 1;
                        }, 1000);
                    })
            });
        },
    }

    const sample_time = 16;
    const sample_time_Precipitation = 206;
    t.describe('AMeDAS', function () {
        const screenshotDir = path.join(currentDir, this.title);
        mkdir(screenshotDir);
        const masterScreenshotDir = path.join(currentDir, 'master', this.title);

        t.it('AMeDAS_Sunshine_on', function (done) {
            driver.get('https://www.yahoo.co.jp')
                .then(() => driver.sleep(2000))
                .then(() => driver.get(url + pagePath.amedas))
                .then(() => driver.sleep(2000))
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[1]')).click()) // @test AMeDASをON（SunshineをON）
                .then(() => common.checkstatus())
                .then(() => driver.sleep(1000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        
        t.it('AMeDAS_Temperature_on', function (done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[3]/div[2]/div[2]')).click() // @test TemperatureをON
                .then(() => common.checkstatus())
                .then(() => driver.sleep(1000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('AMeDAS_Precipitation_on', function (done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[3]/div[2]/div[3]')).click() // @test PrecipitationをON
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[2]/div[1]')).click()) // @test Validtimeを開く
                .then(() => driver.executeScript(`document.querySelector('body > div:nth-child(4) > div > div > div > div:nth-child(${sample_time_Precipitation}) > span').click();`)) // @test Validtimeを変更
                .then(() => common.checkstatus())
                .then(() => driver.sleep(1000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('AMeDAS_SnowDepth_on', function (done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[3]/div[2]/div[4]')).click() // @test Snow depthをON
                .then(() => common.checkstatus())
                .then(() => driver.sleep(1000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });


        t.it('AMeDAS_Wind_on', function (done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[3]/div[1]')).click() // @test WindをON
                .then(() => common.checkstatus())
                .then(() => driver.sleep(1000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('AMeDAS_validtime_change', function (done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[3]/div[2]/div[1]')).click() // @test SunshineをON
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[3]/div[1]')).click()) // @test WindをOFF
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[2]/div[1]')).click()) // @test Validtimeを開く
                .then(() => driver.executeScript(`document.querySelector('body > div:nth-child(4) > div > div > div > div:nth-child(${sample_time}) > span').click();`)) // @test Validtimeを変更
                .then(() => common.checkstatus())
                .then(() => driver.sleep(1000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('AMeDAS_zoom_out', function (done) {

            driver.findElement(By.className('ol-zoom-out')).click() // @test mapズームアウト
                .then(() => driver.actions().mouseMove({ x: -50, y: 0 }).perform())
                .then(() => driver.sleep(4000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('AMeDAS_tooltip', function (done) {
            driver.actions().mouseMove(driver.findElement(By.tagName('body')), { x: 650, y: 300 }).perform() // @test ツールチップ表示
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('AMeDAS_zoom_in', function (done) {
            driver.actions().mouseMove(driver.findElement(By.tagName('body'))).perform()
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()) // @test mapズームイン
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()) // @test mapズームイン
                .then(() => driver.actions().mouseMove({ x: -50, y: 0 }).perform())
                .then(() => driver.sleep(4000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });


        t.it('AMeDAS_move_area', function (done) {
            driver.findElement(By.className('ol-zoom-out')).click() // @test mapズームアウト
            driver.sleep(1000)
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 500, y: 101 }).mouseDown().mouseMove({ x: 0, y: -1 }).mouseMove({ x: -200, y: 200 }).perform()) // @test mapを移動
                .then(() => driver.sleep(500))
                .then(() => driver.actions().mouseUp().perform())
                .then(() => driver.sleep(3000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                }).catch(errorHandler);
        });
    });
}