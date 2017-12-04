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
    // @func_end
    t.describe('ACOSforVA', function () {
        const screenshotDir = path.join(currentDir, this.title);
        mkdir(screenshotDir);
        const masterScreenshotDir = path.join(currentDir, 'master', this.title);
        const tooltip_point = { x: 648, y: 593 };
        t.it('ACOSforVA_init', function (done) {
            driver.get('https://www.yahoo.co.jp')
                .then(() => driver.sleep(2000))
                .then(() => driver.get(url + pagePath.acos)) // @test acos画面取得
                .then(() => driver.sleep(2000))
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div')).click()) // @test acosのチェックボックスをクリック
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャ取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        // t.it('ACOSforVA_tooltip', function (done) {
        //     driver.actions().mouseMove(driver.findElement(By.tagName('body')), { x: tooltip_point.x, y: tooltip_point.y }).perform() // @test ツールチップ表示
        //         .then(() => driver.sleep(500))
        //         .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャ取得
        //         .then((result) => {
        //             assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
        //             done();
        //         })
        //         .catch(errorHandler);
        // });
        t.it('ACOSforVA_map_zoom_in', function (done) {
            driver.findElement(By.className('ol-zoom-in')).click() // @test ズームイン
                .then(() => common.checkstatus())
                .then(() => driver.sleep(3000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャ取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('ACOSforVA_map_zoom_out', function (done) {
            driver.findElement(By.className('ol-zoom-out')).click() // @test ズームアウト
                .then(() => driver.findElement(By.className('ol-zoom-out')).click()) // @test ズームアウト
                .then(() => common.checkstatus())
                .then(() => driver.sleep(3000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャ取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('ACOSforVA_map_slide', function (done) {
            driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 650, y: 401 }).mouseDown().mouseMove({ x: 0, y: -1 }).mouseMove({ x: 500, y: -200 }).perform() // @test mapを移動
                .then(() => driver.sleep(500))
                .then(() => driver.actions().mouseUp().perform())
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャ取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                })
                .then(() => { done(); })
                .catch(errorHandler);
        });
    });
}