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
    radar: '#/introduction/radar?eventid=catalyst_test&testmap=olmap',
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

    //代表的な地域までの移動をファンクション化
    const move_area = { // @func("move_area")
        JP: () => {
            driver.findElement(By.className('ol-zoom-out')).click() // @test ズームアウト
        },
        US_AK: () => {
            driver.findElement(By.className('ol-zoom-out')).click() // @test ズームアウト
                .then(() => driver.findElement(By.className('ol-zoom-out')).click()) // @test ズームアウト
                .then(() => driver.findElement(By.className('ol-zoom-out')).click()) // @test ズームアウト
                .then(() => driver.sleep(500)) //ドラッグ時の慣性をなくすため
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 700, y: 101 }).mouseDown().mouseMove({ x: 0, y: -1 }).perform().mouseMove({ x: -400, y: 250 }).perform()) // @test アラスカへ移動 
                .then(() => driver.sleep(500)) //ドラッグ時の慣性をなくすため
                .then(() => driver.actions().mouseUp().perform())
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()) // @test ズームイン
        },
        US_GU: () => {
            driver.findElement(By.className('ol-zoom-out')).click() // @test ズームアウト
                .then(() => driver.findElement(By.className('ol-zoom-out')).click()) // @test ズームアウト
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 400, y: 401 }).mouseDown().mouseMove({ x: -0, y: -1 }).mouseMove({ x: -50, y: -280 }).perform()) // @test グアムへ移動
                .then(() => driver.sleep(500)) //ドラッグ時の慣性をなくすため
                .then(() => driver.actions().mouseUp().perform())
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()) // @test ズームイン
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()) // @test ズームイン
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()) // @test ズームイン
        },
        US_HI: () => {
            driver.findElement(By.className('ol-zoom-out')).click() // @test ズームアウト
                .then(() => driver.findElement(By.className('ol-zoom-out')).click()) // @test ズームアウト
                .then(() => driver.findElement(By.className('ol-zoom-out')).click()) // @test ズームアウト
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 700, y: 301 }).mouseDown().mouseMove({ x: 0, y: -1 }).mouseMove({ x: -450, y: -150 }).perform()) // @test ハワイへ移動
                .then(() => driver.sleep(500)) //ドラッグ時の慣性をなくすため
                .then(() => driver.actions().mouseUp().perform())
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()) // @test ズームイン
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()) // @test ズームイン
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 400, y: 101 }).mouseDown().mouseMove({ x: 0, y: -1 }).mouseMove({ x: 300, y: 200 }).perform()) // @test ハワイへ移動
                .then(() => driver.actions().mouseUp().perform());
        },
        US_NA: () => {
            driver.findElement(By.className('ol-zoom-out')).click() // @test ズームアウト
                .then(() => driver.findElement(By.className('ol-zoom-out')).click()) // @test ズームアウト
                .then(() => driver.findElement(By.className('ol-zoom-out')).click()) // @test ズームアウト
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 1000, y: 101 }).mouseDown().mouseMove({ x: 0, y: -1 }).mouseMove({ x: -700, y: 0 }).perform()) // @test 北アメリカへ移動
                .then(() => driver.sleep(500)) //ドラッグ時の慣性をなくすため
                .then(() => driver.actions().mouseUp().perform())
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()); // @test ズームイン
        },
        US_PR: () => {
            driver.findElement(By.className('ol-zoom-out')).click() // @test ズームアウト
                .then(() => driver.findElement(By.className('ol-zoom-out')).click()) // @test ズームアウト
                .then(() => driver.findElement(By.className('ol-zoom-out')).click()) // @test ズームアウト
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 1200, y: 401 }).mouseDown().mouseMove({ x: 0, y: -1 }).mouseMove({ x: -900, y: -120 }).perform()) // @test プエルトリコへ移動
                .then(() => driver.sleep(500)) //ドラッグ時の慣性をなくすため
                .then(() => driver.actions().mouseUp().perform())
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()) // @test ズームイン
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()); // @test ズームイン
        },
        EU: () => {
            driver.findElement(By.className('ol-zoom-out')).click() // @test ズームアウト
                .then(() => driver.findElement(By.className('ol-zoom-out')).click()) // @test ズームアウト
                .then(() => driver.findElement(By.className('ol-zoom-out')).click()) // @test ズームアウト
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 400, y: 101 }).mouseDown().mouseMove({ x: 0, y: -1 }).mouseMove({ x: 800, y: 120 }).perform()) // @test ヨーロッパへ移動
                .then(() => driver.sleep(500)) //ドラッグ時の慣性をなくすため
                .then(() => driver.actions().mouseUp().perform())
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()) // @test ズームイン
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()) // @test ズームイン
        },
        AU: () => {
            driver.findElement(By.className('ol-zoom-out')).click() // @test ズームアウト
                .then(() => driver.findElement(By.className('ol-zoom-out')).click()) // @test ズームアウト
                .then(() => driver.findElement(By.className('ol-zoom-out')).click()) // @test ズームアウト
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 300, y: 500 }).mouseDown().mouseMove({ x: 0, y: -380 }).perform()) // @test オーストラリアへ移動
                .then(() => driver.sleep(500)) //ドラッグ時の慣性をなくすため
                .then(() => driver.actions().mouseUp().perform())
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()) // @test ズームイン
        },
        KR: () => {
            driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 500, y: 101 }).mouseDown().mouseMove({ x: 0, y: -1 }).mouseMove({ x: 500, y: 0 }).perform() // @test 韓国へ移動
                .then(() => driver.sleep(500)) //ドラッグ時の慣性をなくすため
                .then(() => driver.actions().mouseUp().perform())
        },
        TW: () => {
            driver.findElement(By.className('ol-zoom-out')).click() // @test ズームアウト
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 500, y: 501 }).mouseDown().mouseMove({ x: 0, y: -1 }).mouseMove({ x: 400, y: -300 }).perform()) // @test 台湾へ移動
                .then(() => driver.sleep(500)) //ドラッグ時の慣性をなくすため
                .then(() => driver.actions().mouseUp().perform())
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()) // @test ズームイン
        }, // @func_end
    };

    const sample_time = { //時刻に対応する、セレクトボックスのインデックス
        JP: 897,
        US_AK: 447,
        US_GU: 447,
        US_HI: 447,
        US_NA: 447,
        US_PR: 447,
        EU: 299,
        AU: 449,
        KR: 446,
        TW: 745,
        JP_ICDB: 970,
        JMA_NOWCAS_PRCINT_HRES: 981
    };

    function select(index, selectbox_num) {
        driver.executeScript(`var element = document.querySelector('#root > div > div:nth-child(2) > div > div > div:nth-child(1) > div > div > div > div > div > div > div:nth-child(${selectbox_num}) > div:nth-child(2) > select');
            element.value = element.querySelector('option:nth-child(${index})').value
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent('change', true, true);
            element.dispatchEvent(evt);`)
    }

    // @func(check_func)
    function check_func(func_num, func_name, area, time, screenshotDir, masterScreenshotDir) {
        t.it('Radar_' + func_name + '_on', function (done) {
            driver.get('https://www.yahoo.co.jp')
                .then(() => driver.sleep(2000))
                .then(() => driver.get(url + pagePath.radar))
                .then(() => driver.sleep(2000))
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[1]/div[1]/div')).click()) // @test radarON)
                .then(() => driver.findElement(By.xpath(`//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[${func_num + 1}]/div[1]/div`)).click()) // @test 機能ON
                .then(() => common.checkstatus())
                .then(() => driver.sleep(1000))
                .then(() => move_area[area]()) // @test マップをスライドして該当するエリアへ移動
                .then(() => driver.sleep(7000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画像比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler)
        });
        t.it('Radar_' + func_name + '_validtime_change', function (done) {
            driver.sleep(100)
                .then(() => select(time, func_num + 1))
                .then(() => common.checkstatus())
                .then(() => driver.sleep(1000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画像比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                }).catch(errorHandler);
        });
        t.it('Radar_' + func_name + '_coverage_off', function (done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[1]/div[2]/div')).click() // @test coverage OFF
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画像比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

    }
    // @func_end

    t.describe('Radar', function () {
        const screenshotDir = path.join(currentDir, this.title);
        mkdir(screenshotDir);
        const masterScreenshotDir = path.join(currentDir, 'master', this.title);
        // @case:JP
        check_func(1, "JP", "JP", sample_time.JP, screenshotDir, masterScreenshotDir); // @func_call(check_func)
        // @case:US_AK
        check_func(2, "US_AK", "US_AK", sample_time.US_AK, screenshotDir, masterScreenshotDir); // @func_call(check_func)
        // @case:US_GU
        check_func(3, "US_GU", "US_GU", sample_time.US_GU, screenshotDir, masterScreenshotDir); // @func_call(check_func)
        // @case:US_AK
        check_func(4, "US_HI", "US_HI", sample_time.US_HI, screenshotDir, masterScreenshotDir); // @func_call(check_func)
        // @case:US_NA
        check_func(5, "US_NA", "US_NA", sample_time.US_NA, screenshotDir, masterScreenshotDir); // @func_call(check_func)
        // @case:US_PR
        check_func(6, "US_PR", "US_PR", sample_time.US_PR, screenshotDir, masterScreenshotDir); // @func_call(check_func)
        // @case:EU
        check_func(7, "EU", "EU", sample_time.EU, screenshotDir, masterScreenshotDir); // @func_call(check_func)
        // @case:AU
        check_func(8, "AU", "AU", sample_time.AU, screenshotDir, masterScreenshotDir); // @func_call(check_func)
        // @case:KR
        check_func(9, "KR", "KR", sample_time.KR, screenshotDir, masterScreenshotDir); // @func_call(check_func)
        // @case:TW
        check_func(10, "TW", "TW", sample_time.TW, screenshotDir, masterScreenshotDir); // @func_call(check_func)

        //以下例外
        t.it('Radar_JP_ICDB_on', function (done) {
            driver.get('https://www.yahoo.co.jp')
                .then(() => driver.sleep(2000))
                .then(() => driver.get(url + pagePath.radar))
                .then(() => driver.sleep(2000))
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[1]/div[1]/div')).click()) // @test radarON)
                .then(() => driver.findElement(By.xpath(`//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[12]/div[1]/div`)).click()) // @test 機能ON
                .then(() => common.checkstatus())
                .then(() => driver.sleep(1000))
                .then(() => move_area["JP"]())
                .then(() => driver.sleep(4000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画像比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler)
        });
        t.it('Radar_JP_ICDB_validtime_change', function (done) {
            driver.executeScript(`var element = document.querySelector('#root > div > div:nth-child(2) > div > div > div:nth-child(1) > div > div > div > div > div > div > div:nth-child(13) > select');
            element.value = element.querySelector('option:nth-child(${sample_time.JP_ICDB})').value
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent('change', true, true);
            element.dispatchEvent(evt);`) // @test 過去のデータを表示
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画像比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                }).catch(errorHandler);
        });
        t.it('Radar_JP_ECHOTOP', function (done) {
            driver.findElement(By.xpath(`//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[14]/div`)).click() // @test 機能ON
                .then(() => common.checkstatus())
                .then(() => driver.sleep(3000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画像比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Radar_JP_IXDB_coverage_off', function (done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[1]/div[2]/div')).click() // @test coverage OFF
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画像比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });


        // t.it('Radar_JMA_NOWCAS_PRCIN_on', function (done) {
        //     driver.get('https://www.yahoo.co.jp')
        //         .then(() => driver.get(url + pagePath.radar))
        //         .then(() => driver.sleep(2000))
        //         .then(() => driver.findElement(By.xpath(`//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[13]/div[1]`)).click()) // @test 機能ON
        //         .then(() => common.checkstatus())
        // .then(() => driver.sleep(1000))
        //         .then(() => move_area["JP"]())
        //         .then(() => driver.sleep(4000))
        //         .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画像比較
        //         .then((result) => {
        //             assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
        //             done();
        //         })
        //         .catch(errorHandler)
        // });

        // t.it('Radar_JMA_NOWCAS_PRCIN_validtime_change', function (done) {
        //     driver.findElement(By.xpath(`//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[13]/div[2]/select/option[${sample_time.JMA_NOWCAS_PRCINT_HRES}]`)).click() // @test 過去時刻を変更
        //         .then(() => common.checkstatus())
        // .then(() => driver.sleep(1000))
        //         .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画像比較
        //         .then((result) => {
        //             assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
        //             done();
        //         }).catch(errorHandler);
        // });

        // t.it('Radar_menu_scroll', function (done) {
        //     driver.get(url + pagePath.radar)
        //         .then(() => driver.wait(webdriver.until.elementLocated(By.className('gm-style')), 2000))
        //         .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[1]/div[1]/div')).click()) // @test RadarチェックボックスON
        //         .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[2]/div[1]/div')).click()) // @test JPチェックボックスON
        //         .then(() => common.checkstatus())
        // .then(() => driver.sleep(1000))
        //         .then(() => driver.executeScript('var element = document.querySelector("#root > div > div:nth-child(2) > div > div > span > div"); element.scrollTop = element.scrollHeight;')) // @test 左メニューをスクロール
        //         .then(() => driver.sleep(500))
        //         .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画像比較
        //         .then((result) => {
        //             assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
        //             done();
        //         })
        //         .catch(errorHandler);
        // });
    });
}