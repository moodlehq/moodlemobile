/*
 admob.js
 Copyright 2014 AppFeel. All rights reserved.
 http://www.appfeel.com
 
 AdMobAds Cordova Plugin (com.admob.google)
 
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to
 deal in the Software without restriction, including without limitation the
 rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 sell copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
var admob = window.admob || {};

/**
 * This enum represents appfeel-cordova-admob plugin events
 */
admob.events = {
  onAdLoaded: "appfeel.cordova.admob.onAdLoaded",
  onAdFailedToLoad: "appfeel.cordova.admob.onAdFailedToLoad",
  onAdOpened: "appfeel.cordova.admob.onAdOpened",
  onAdLeftApplication: "appfeel.cordova.admob.onAdLeftApplication",
  onAdClosed: "appfeel.cordova.admob.onAdClosed",
  onInAppPurchaseRequested: "appfeel.cordova.admob.onInAppPurchaseRequested",
};

/**
 * This enum represents AdMob's supported ad sizes.  Use one of these
 * constants as the adSize when calling createBannerView.
 * @const
 */
admob.AD_SIZE = {
  BANNER: 'BANNER',
  IAB_MRECT: 'IAB_MRECT',
  IAB_BANNER: 'IAB_BANNER',
  IAB_LEADERBOARD: 'IAB_LEADERBOARD',
  SMART_BANNER: 'SMART_BANNER'
};

admob.AD_TYPE = {
  BANNER: 'banner',
  INTERSTITIAL: 'interstitial'
};

admob.PURCHASE_RESOLUTION = {
  RESOLUTION_CANCELED: 2,
  RESOLUTION_FAILURE: 0,
  RESOLUTION_INVALID_PRODUCT: 3,
  RESOLUTION_SUCCESS: 1
};

// This is not used by the plugin, it is just a helper to show how options are specified and their default values
admob.options = {
  publisherId: (/(android)/i.test(navigator.userAgent)) ? "ca-app-pub-8440343014846849/3119840614" : "ca-app-pub-8440343014846849/2335511010",
  interstitialId: (/(android)/i.test(navigator.userAgent)) ? "ca-app-pub-8440343014846849/4596573817" : "ca-app-pub-8440343014846849/3812244218",
  adSize: admob.AD_SIZE.SMART_BANNER,
  bannerAtTop: false,
  overlap: false,
  offsetStatusBar: false,
  isTesting: false,
  adExtras: {},
  autoShowBanner: true,
  autoShowInterstitial: true
};

/**
 * Initialize appfeel-cordova-admob plugin with options:
 * @param {!Object}    options         AdMob options (use admob.options as template)
 * @param {function()} successCallback Callback on success
 * @param {function()} failureCallback Callback on fail
 */
admob.setOptions = function (options, successCallback, failureCallback) {
  if (typeof options === 'function') {
    failureCallback = successCallback;
    successCallback = options;
    options = undefined;
  }

  options = options || admob.DEFAULT_OPTIONS;

  if (typeof options === 'object' && typeof options.publisherId === 'string' && options.publisherId.length > 0) {
    cordova.exec(successCallback, failureCallback, 'AdMobAds', 'setOptions', [options]);

  } else {
    if (typeof failureCallback === 'function') {
      failureCallback('options.publisherId should be specified.')
    }
  }
};

/**
 * Creates a new AdMob banner view.
 *
 * @param {!Object}    options         The options used to create a banner. (use admob.options as template)
 * @param {function()} successCallback The function to call if the banner was created successfully.
 * @param {function()} failureCallback The function to call if create banner  was unsuccessful.
 */
admob.createBannerView = function (options, successCallback, failureCallback) {
  if (typeof options === 'function') {
    failureCallback = successCallback;
    successCallback = options;
    options = undefined;
  }
  options = options || {};
  cordova.exec(successCallback, failureCallback, 'AdMobAds', 'createBannerView', [options]);
};

/*
 * Show or hide Ad.
 *
 * @param {boolean} show true to show, false to hide.
 * @param {function()} successCallback The function to call if the ad was shown successfully.
 * @param {function()} failureCallback The function to call if the ad failed to be shown.
 */
admob.showBannerAd = function (show, successCallback, failureCallback) {
  if (show === undefined) {
    show = true;

  } else if (typeof show === 'function') {
    failureCallback = successCallback;
    successCallback = show;
    show = true;
  }
  cordova.exec(successCallback, failureCallback, 'AdMobAds', 'showBannerAd', [show]);
};

/**
 * Hides and destroys the banner view. CreateBanner should be called if new ads were to be shown.
 * @param {function()} successCallback The function to call if the view was destroyed successfully.
 * @param {function()} failureCallback The function to call if failed to destroy view.
 */
admob.destroyBannerView = function (successCallback, failureCallback) {
  cordova.exec(successCallback, failureCallback, 'AdMobAds', 'destroyBannerView', []);
};

/**
 * Request an AdMob interstitial ad.
 *
 * @param {!Object}    options         The options used to request an ad. (use admob.options as template)
 * @param {function()} successCallback The function to call if an ad was requested successfully.
 * @param {function()} failureCallback The function to call if an ad failed to be requested.
 */
admob.requestInterstitialAd = function (options, successCallback, failureCallback) {
  if (typeof options === 'function') {
    failureCallback = successCallback;
    successCallback = options;
    options = undefined;
  }
  options = options || {};
  cordova.exec(successCallback, failureCallback, 'AdMobAds', 'requestInterstitialAd', [options]);
};

/**
 * Shows an interstitial ad. This function should be called when onAdLoaded occurred.
 *
 * @param {function()} successCallback The function to call if the ad was shown successfully.
 * @param {function()} failureCallback The function to call if the ad failed to be shown.
 */
admob.showInterstitialAd = function (successCallback, failureCallback) {
  cordova.exec(successCallback, failureCallback, 'AdMobAds', 'showInterstitialAd', []);
};

/**
 * Records a resolution after an inAppPurchase.
 *
 * @param {Integer}    purchaseId      The id of the purchase.
 * @param {Integer}    resolution      The resolution code.
 * @param {function()} successCallback The function to call if the ad was shown successfully.
 * @param {function()} successCallback The function to call if the ad was shown successfully.
 * @param {function()} failureCallback The function to call if the ad failed to be shown.
 */
admob.recordResolution = function (purchaseId, resolution, successCallback, failureCallback) {
  if (purchaseId === undefined || resolution === undefined) {
    if (typeof failureCallback === 'function') {
      failureCallback('purchaseId and resolution should be specified.')
    }
  }
  cordova.exec(successCallback, failureCallback, 'AdMobAds', 'recordResolution', [purchaseId, resolution]);
};

/**
 * Records a resolution after an inAppPurchase.
 *
 * @param {Integer}    purchaseId           The id of the purchase.
 * @param {Integer}    billingResponseCode  The resolution code.
 * @param {function()} successCallback      The function to call if the ad was shown successfully.
 * @param {function()} successCallback      The function to call if the ad was shown successfully.
 * @param {function()} failureCallback      The function to call if the ad failed to be shown.
 */
admob.recordPlayBillingResolution = function (purchaseId, billingResponseCode, successCallback, failureCallback) {
  if (purchaseId === undefined || billingResponseCode === undefined) {
    if (typeof failureCallback === 'function') {
      failureCallback('purchaseId and billingResponseCode should be specified.')
    }
  }
  cordova.exec(successCallback, failureCallback, 'AdMobAds', 'recordResolution', [purchaseId, billingResponseCode]);
};

if (typeof module !== 'undefined') {
  // Export admob
  module.exports = admob;
}

window.admob = admob;
window.tappx = admob;
