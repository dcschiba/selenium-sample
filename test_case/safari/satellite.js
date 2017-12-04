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
    satellite: '#/introduction/satellite?eventid=catalyst_test&testmap=olmap',
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


    //代表的な地域までの移動をファンクション化
    const move_area = {
        EU: () => { // @func("move_area.EU")
            driver.findElement(By.className('ol-zoom-out')).click() // @test ズームアウト
                .then(() => driver.findElement(By.className('ol-zoom-out')).click()) // @test ズームアウト
                .then(() => driver.findElement(By.className('ol-zoom-out')).click()) // @test ズームアウト
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 320, y: 101 }).mouseDown().mouseMove({ x: 0, y: -1 }).mouseMove({ x: 400, y: 120 }).perform()) // @test ヨーロッパへ移動
                .then(() => driver.sleep(500))
                .then(() => driver.actions().mouseUp().perform())
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 320, y: 101 }).mouseDown().mouseMove({ x: 0, y: -1 }).mouseMove({ x: 400, y: 0 }).perform()) // @test ヨーロッパへ移動
                .then(() => driver.sleep(500))
                .then(() => driver.actions().mouseUp().perform())
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()) // @test ズームイン
                .then(() => driver.findElement(By.className('ol-zoom-in')).click()) // @test ズームイン
        }, // @func_end
    };

    const select = {
        case: (value) => {
            return driver.executeScript(`var element = document.querySelector('#satellite_type_select');
            element.value = '${value}'
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent('change', true, true);
            element.dispatchEvent(evt);`);
        },
        time: (index) => {
            return driver.executeScript(`var element = document.querySelector('#satellite_validtime_select');
            element.value = element.querySelector('option:nth-child(${index})').value
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent('change', true, true);
            element.dispatchEvent(evt);`)
        }
    }

    //ここからテストケース
    t.describe('Satellite', function () {
        const screenshotDir = path.join(currentDir, this.title);
        mkdir(screenshotDir);
        const masterScreenshotDir = path.join(currentDir, 'master', this.title);
        const tooltip_point = {
            sat_world: { x: 500, y: 250 },
            hima8_jp: { x: 500, y: 250 },
            msg_fd: { x: 500, y: 250 },
            msg_iodc_fd: { x: 500, y: 250 }
        }
        const sample_time = {
            sat_world: 2,
            hima8_jp: 37,
            msg_fd: 7,
            msg_iodc_fd: 7
        }

        //init 初期表示 → 拡大 → 縮小 → スライド
        t.it('Satellite_init', function (done) {
            driver.get(url + pagePath.satellite) // @test 画面取得
                .then(() => driver.sleep(2000))
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[1]/div[1]/div')).click()) // @test Satellite_ON
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        t.it('Satellite_map_zoom_in', function (done) {
            driver.findElement(By.className('ol-zoom-in')).click() // @test ズームイン
                .then(() => driver.actions().mouseMove({ x: -50, y: 0 }).perform())
                .then(() => driver.sleep(5000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_map_zoom_out', function (done) {
            driver.findElement(By.className('ol-zoom-out')).click() // @test ズームアウト
                .then(() => driver.findElement(By.className('ol-zoom-out')).click())
                .then(() => driver.actions().mouseMove({ x: -50, y: 0 }).perform())
                .then(() => driver.sleep(6000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_map_slide', function (done) {
            driver.actions().mouseMove(driver.findElement(By.id('map')), { x: 100, y: 101 }).mouseDown().mouseMove({ x: 0, y: -1 }).mouseMove({ x: 600, y: 0 }).perform() // @test 西へ600pxスライド
                .then(() => driver.sleep(500)) //ドラッグ時の慣性をなくすため　
                .then(() => driver.actions().mouseUp().perform())
                .then(() => driver.sleep(5000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                })

                .then(() => { done(); })
                .catch(errorHandler);
        });

        //SAT_WORLD
        //SAT_WORLD_wv
        t.it('Satellite_sat_world_wv_on', function (done) {
            driver.get('https://www.yahoo.co.jp')
                .then(() => driver.sleep(2000)) // 描画待ち
                .then(() => driver.get(url + pagePath.satellite)) // @test 画面取得   
                .then(() => driver.sleep(2000))
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[1]/div[1]/div')).click()) // @test Satellite_ON
                .then(() => select.case("SAT_WORLD_WV")) // @test SAT_WORLD_WVを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_sat_world_wv_validtime_change', function (done) {
            select.time(sample_time.sat_world) // @test 過去のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        //SAT_WORLD_IR
        t.it('Satellite_sat_world_ir_on', function (done) {
            select.case("SAT_WORLD_IR") // @test SAT_WORLD_IRを選択
                .then(() => select.time(1)) // @test 最新のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_sat_world_ir_validtime_change', function (done) {
            select.time(sample_time.sat_world) // @test 過去のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        //SAT_WORLD_CLDTOP
        t.it('Satellite_sat_world_cldtop_on', function (done) {
            select.case("SAT_WORLD_CLDTOP") // @test SAT_WORLD_CLDTOPを選択
                .then(() => select.time(1)) // @test 最新のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_sat_world_cldtop_validtime_change', function (done) {
            select.time(sample_time.sat_world) // @test 過去のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_sat_world_cldtop_tooltip', function (done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[1]/div[2]/div')).click() // @test Tooltip_on
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: tooltip_point.sat_world.x, y: tooltip_point.sat_world.y }).perform()) // @test カーソルを移動させツールチップを表示させる
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        //HIMA8
        //HIMA8_JP
        t.it('Satellite_hima8_jp_wv_on', function (done) {
            driver.get('https://www.yahoo.co.jp')
                .then(() => driver.sleep(2000)) // 描画待ち
                .then(() => driver.get(url + pagePath.satellite)) // @test 画面取得   
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[1]/div[1]/div')).click()) // @test Satellite_on
                .then(() => select.case("HIMA8_JP_WV")) // @test HIMA8_JP_WVを選択
                .then(() => select.time(1)) // @test 最新のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_hima8_jp_wv_validtime_change', function (done) {
            select.time(sample_time.hima8_jp) // @test 過去のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        //HIMA8_JP_VIS
        t.it('Satellite_hima8_jp_vis_on', function (done) {
            select.case("HIMA8_JP_VIS") // @test HIMA8_JP_VISを選択
                .then(() => select.time(1)) // @test 最新のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_hima8_jp_vis_validtime_change', function (done) {
            select.time(sample_time.hima8_jp) // @test 過去のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        //HIMA8_JP_IR
        t.it('Satellite_hima8_jp_ir_on', function (done) {
            select.case("HIMA8_JP_IR") // @test HIMA8_JP_IRを選択
                .then(() => select.time(1)) // @test 最新のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_hima8_jp_ir_validtime_change', function (done) {
            select.time(sample_time.hima8_jp) // @test 過去のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        //HIMA8_JP_CLDTOP
        t.it('Satellite_hima8_jp_cldtop_on', function (done) {
            select.case("HIMA8_JP_CLDTOP") // @test HIMA8_JP_CLDTOPを選択
                .then(() => select.time(1)) // @test 最新のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_hima8_jp_cldtop_validtime_change', function (done) {
            select.time(sample_time.hima8_jp) // @test 過去のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_hima8_jp_cldtop_tooltip', function (done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[1]/div[2]/div')).click() // @test Tooltip_on
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: tooltip_point.hima8_jp.x, y: tooltip_point.hima8_jp.y }).perform()) // @test カーゾルを移動させてツールチップ表示
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        //ここからヨーロッパ
        //MSG_FD_VIS
        //MSG_FD
        t.it('Satellite_msg_fd_vis_on', function (done) {
            driver.get('https://www.yahoo.co.jp')
                .then(() => driver.sleep(2000)) // 描画待ち
                .then(() => driver.get(url + pagePath.satellite)) // @test 画面取得   
                .then(() => driver.sleep(2000))
                //位置調整
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[1]/div[1]/div')).click()) // @test Satellite_on
                .then(() => move_area.EU()) // @func_call(move_area.EU)
                .then(() => select.case("MSG_FD_VIS")) // @test  MSG_FD_VISを選択
                .then(() => select.time(1)) // @test 最新のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_msg_fd_vis_validtime_change', function (done) {
            select.time(sample_time.msg_fd) // @test 過去のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        //MSG_FD_IR
        t.it('Satellite_msg_fd_ir_on', function (done) {
            select.case("MSG_FD_IR") // @test MSG_FD_IRを選択
                .then(() => select.time(1)) // @test 最新のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_msg_fd_ir_validtime_change', function (done) {
            select.time(sample_time.msg_fd) // @test 過去のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        //MSG_FD_WV
        t.it('Satellite_msg_fd_wv_on', function (done) {
            select.case("MSG_FD_WV") // @test MSG_FD_WV
                .then(() => select.time(1)) // @test 最新のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_msg_fd_wv_validtime_change', function (done) {
            select.time(sample_time.msg_fd) // @test 過去のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        //MSG_FD_CLDTOP
        t.it('Satellite_msg_fd_cldtop_on', function (done) {
            select.case("MSG_FD_CLDTOP") // @test  MSG_FD_CLDTOPを選択
                .then(() => select.time(1)) // @test 最新のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_msg_fd_cldtop_validtime_change', function (done) {
            select.time(sample_time.msg_fd) // @test 過去のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_msg_fd_cldtop_tooltip', function (done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[1]/div[2]/div')).click() // @test Tooltip_on
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: tooltip_point.msg_fd.x, y: tooltip_point.msg_fd.y }).perform()) // @test ツールチップ表示
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        //MSG_IODC_FD
        //MSG_IODC_FD_VIS
        t.it('Satellite_msg_iodc_fd_vis_on', function (done) {
            driver.get('https://www.yahoo.co.jp')
                .then(() => driver.sleep(2000)) // 描画待ち
                .then(() => driver.get(url + pagePath.satellite)) // @test Satellite画面取得   
                .then(() => driver.sleep(2000))
                //位置調整
                .then(() => driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[1]/div[1]/div')).click()) // @test Satellite_on
                .then(() => move_area.EU()) // @func_call(move_area.EU)
                .then(() => driver.actions().mouseUp().perform())
                .then(() => select.case("MSG_IODC_FD_VIS")) // @test MSG_IODC_FD_VISを選択
                .then(() => select.time(1)) // @test 最新のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_msg_iodc_fd_vis_validtime_change', function (done) {
            select.time(sample_time.msg_iodc_fd) // @test 過去のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000)) //2秒待機
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        //MSG_IODC_FD_IR
        t.it('Satellite_msg_iodc_fd_ir_on', function (done) {
            select.case("MSG_IODC_FD_IR") // @test MSG_IODC_FD_IRを選択
                .then(() => select.time(1)) // @test 最新のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_msg_iodc_fd_ir_validtime_change', function (done) {
            select.time(sample_time.msg_iodc_fd) // @test 過去のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000)) //2秒待機
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        //MSG_IODC_FD_WV
        t.it('Satellite_msg_iodc_fd_wv_on', function (done) {
            select.case("MSG_IODC_FD_WV") // @test MSG_IODC_FD_WVを選択
                .then(() => select.time(1)) // @test 最新のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_msg_iodc_fd_wv_validtime_change', function (done) {
            select.time(sample_time.msg_iodc_fd) // @test 過去のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });

        //MSG_IODC_FD_CLDTOP
        t.it('Satellite_msg_iodc_fd_cldtop_on', function (done) {
            select.case("MSG_IODC_FD_CLDTOP") // @test  MSG_IODC_FD_CLDTOPを選択
                .then(() => select.time(1)) // @test 最新のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_msg_iodc_fd_cldtop_validtime_change', function (done) {
            select.time(sample_time.msg_iodc_fd) // @test 過去のデータを選択
                .then(() => common.checkstatus())
                .then(() => driver.sleep(2000))
                .then(() => common.saveScreenshot(screenshotDir, masterScreenshotDir, this.test.title)) // @test 画面比較
                .then((result) => {
                    assert.equal(result.equality, 0, `比較結果に差異があります。【${this.test.title}_diff.png】を確認してください。`);
                    done();
                })
                .catch(errorHandler);
        });
        t.it('Satellite_msg_iodc_fd_cldtop_tooltip', function (done) {
            driver.findElement(By.xpath('//div[@id="root"]/div/div[2]/div/div/div[1]/div/div/div/div/div/div/div[1]/div[2]/div')).click() // @test Tooltipのチェックボックスをクリック 
                .then(() => driver.actions().mouseMove(driver.findElement(By.id('map')), { x: tooltip_point.msg_iodc_fd.x, y: tooltip_point.msg_iodc_fd.y }).perform()) // @test ツールチップ表示
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