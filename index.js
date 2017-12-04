'use strict';
const webdriver = require('selenium-webdriver');
const t = require('selenium-webdriver/testing');
const gm = require('gm').subClass({ imageMagick: true });
const fs = require('fs');
const seleniumSrv = 'http://pt-wrapgen02-vmg:4444/wd/hub'; // Hubサーバ

const capabilities = {
    browserName: process.env.browserName,
    version: process.env.version,
    platform: process.env.platform,
};

if (capabilities.browserName === 'chrome') {
    capabilities.chromeOptions = {
        args: ['disable-infobars'],
    };
}

// キャプチャ取得処理
webdriver.WebDriver.prototype.saveScreenshot = (filename) => {
    return new Promise((resolve) => {
        driver.takeScreenshot().then((data) => {
            fs.writeFile(filename, data, 'base64', (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    });
};

// 画像切り抜き処理（element）
webdriver.WebDriver.prototype.cropImageByElement = (beforeImage, afterImage, element) => {
    return new Promise((resolve, reject) => {
        Promise.all([element.getSize(), element.getLocation()]).then((result) => {
            gm(beforeImage).crop(result[0].width, result[0].height, result[1].x, result[1].y).write(afterImage, (err, stdout, stderr, command) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ stdout, stderr, command });
            });
        });
    });
};
// 画像切り抜き処理（element）
webdriver.WebDriver.prototype.cropImageByElement_safari = (beforeImage, afterImage, element) => {
    return new Promise((resolve, reject) => {
        Promise.all([element.getSize(), element.getLocation()]).then((result) => {
            gm(beforeImage).crop(result[0].width, result[0].height - 30, result[1].x, result[1].y).write(afterImage, (err, stdout, stderr, command) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ stdout, stderr, command });
            });
        });
    });
};


// 画像比較処理
webdriver.WebDriver.prototype.compareImage = (image1, image2, options) => {
    return new Promise((resolve, reject) => {
        gm().compare(image1, image2, options, (err, isEqual, equality, raw) => {
            if (err) {
                reject(err);
                return;
            }
            resolve({ isEqual, equality, raw });
        });
    });
};

// テスト実行前処理
t.before((done) => {
    // windowサイズ
    driver.manage().window().setSize(1300, 700).then(() => {
        done();
    });
});

// テスト実行後処理
t.after((done) => {
    // セッションの終了
    driver.quit();
    done();
});

// 各テストケース実行前処理
t.beforeEach((done) => {
    done();
});

// 各テストケース実行後処理
t.afterEach((done) => {
    done();
});


// ブラウザセット
const driver = new webdriver.Builder().usingServer(seleniumSrv).withCapabilities(capabilities).build();
if (capabilities.browserName === "safari") {
    var radar = require('./test_case/safari/radar.js');
    var satellite = require('./test_case/safari/satellite.js');
    var acos = require('./test_case/safari/acos.js');
    var radaramedas = require('./test_case/safari/radaramedas.js');
    var asc = require('./test_case/safari/asc.js');
    var amedas = require('./test_case/safari/amedas.js');

    amedas.test(driver, t); // 済
    // radar.test(driver, t); // WRAP-JS対応待ち
    // acos.test(driver, t);// 残ツールチップ
    // asc.test(driver, t); // 済
    // radaramedas.test(driver, t); // 済
    // satellite.test(driver, t);

} else {
    var radar = require('./test_case/radar.js');
    var satellite = require('./test_case/satellite.js');
    var acos = require('./test_case/acos.js');
    var radaramedas = require('./test_case/radaramedas.js');
    var asc = require('./test_case/asc.js');
    var amedas = require('./test_case/amedas.js');

    //amedas.test(driver, t);
    //radar.test(driver, t);
    //acos.test(driver, t);
    if (capabilities.browserName !== "internet explorer") {
        //asc.test(driver, t);
    }
    //radaramedas.test(driver, t);
    satellite.test(driver, t);
}
