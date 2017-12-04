'use strict';
const webdriver = require('selenium-webdriver');
const gm = require('gm').subClass({ imageMagick: true });
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const By = webdriver.By;

const url = 'https://pt-wrap01.wni.co.jp/Catalyst//'; // テスト対象ページ
const currentDir = process.cwd();
const pagePath = {
    asc: '#/introduction/asc?eventid=catalyst_test&testmap=olmap',
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

    t.describe('ASCScale', function() {
        const screenshotDir = path.join(currentDir, this.title);
        mkdir(screenshotDir);
        const masterScreenshotDir = path.join(currentDir, 'master', this.title);

        t.it('ASCScale_Turbulence_on', function(done) {
            driver.get(url + pagePath.asc)
                .then(() => driver.sleep(3000))
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/span/div/div/div/div/div[1]')).click()) // @test ASC ScaleをON
                .then(() => driver.findElement(By.css('div[title="Zoom out"]')).click()) // @test mapズームアウト
                .then(() => driver.findElement(By.css('div[title="Zoom out"]')).click()) // @test mapズームアウト
                .then(() => driver.findElement(By.css('div[title="Zoom out"]')).click()) // @test mapズームアウト
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 350, y: 100 }).mouseDown().mouseMove({ x: -350, y: 0 }).perform()) // @test mapを右にスライド（日付変更線＋緯度0度付近）
                .then(() => driver.sleep(500))
                .then(() => driver.actions().mouseUp().perform())
                .then(() => driver.sleep(3000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                }).catch(errorHandler);
        });

        t.it('ASCScale_Convection_on', function(done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/span/div/div/div/div/div[3]')).click() // @test TurbulenceをOFF
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/span/div/div/div/div/div[4]')).click()) // @test ConvectionをON
                .then(() => driver.sleep(3000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                }).catch(errorHandler);
        });

        t.it('ASCScale_Icing_on', function(done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/span/div/div/div/div/div[4]')).click() // @test ConvectionをOFF
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/span/div/div/div/div/div[5]')).click()) // @test IcingをON
                .then(() => driver.sleep(3000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                }).catch(errorHandler);
        });

        t.it('ASCScale_validtime_change', function(done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/span/div/div/div/div/div[3]')).click() // @test TurbulenceをON
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/span/div/div/div/div/div[4]')).click()) // @test ConvectionをON
                .then(() => driver.executeScript(`var element = document.querySelector('#root > div > div:nth-child(2) > div > div > span > div > div > div > div > *:nth-child(6)');
                    element.value = element.querySelector('option:nth-child(${sample_time})').value
                    var evt = document.createEvent("HTMLEvents");
                    evt.initEvent('change', true, true);
                    element.dispatchEvent(evt);`)) // @test 過去のデータを表示
                // select:nth-child(2) は使えないので *:nth-child(6) を使う
                .then(() => driver.findElement(By.css('div[title="Zoom in"]')).click()) // @test mapズームイン
                .then(() => driver.sleep(3000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                }).catch(errorHandler);
        });

        const level_index = 8
        t.it('ASCScale_level_change', function(done) {
            // select:nth-child(1) は使えないので *:nth-child(2) を使う
            driver.executeScript(`var element = document.querySelector('#root > div > div:nth-child(2) > div > div > span > div > div > div > div > *:nth-child(7) > *:nth-child(2)');
                element.value = element.querySelector('option:nth-child(${level_index})').value
                var evt = document.createEvent("HTMLEvents");
                evt.initEvent('change', true, true);
                element.dispatchEvent(evt);`) // @test levelの下限を100に設定
                .then(() => driver.sleep(1000))
                .then(() => driver.findElement(By.css('div[title="Zoom out"]')).click()) // @test mapズームアウト
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 500, y: 100 }).mouseDown().mouseMove({ x: -500, y: 0 }).perform()) // @test mapを右にスライド
                .then(() => driver.sleep(500))
                .then(() => driver.actions().mouseUp().perform())
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 500, y: 100 }).mouseDown().mouseMove({ x: -500, y: 0 }).perform()) // @test mapを右にスライド（本初子午線＋緯度0度付近） 
                .then(() => driver.sleep(500))
                .then(() => driver.actions().mouseUp().perform())
                .then(() => driver.sleep(5000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test キャプチャを取得
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                }).catch(errorHandler);
        });
    });
}