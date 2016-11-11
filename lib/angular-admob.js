/*
 admobAngular.js
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


// Support for Ionic/Angular apps
if (typeof angular !== 'undefined') {
  var admobModule = angular.module('admobModule', []);

  window.admob = window.admob || {}; // Cordova admob script is injected after angular one does!!

  function AdmobLauncher($timeout, $q, $rootScope, options, eventPrefix) {
    var
      deviceready = $q.defer(),
      makePromise,
      angularAdmob;

    /**
     * Creates an angular promise for any javascript method.
     * @param   {Function} fn    The javascript function to be called.
     * @param   {Array}    args  The arguments to apply to fn.
     * @param   {Boolean}  sync  When set to true resolves the promise inmediately, otherwise in a timeout wrapper.
     * @returns {Object}   $q.defer().promise object.
     */
    makePromise = function makePromise(fn, args, sync) {
      var
        deferred = $q.defer(),
        success = function (response) {
          if (sync) {
            deferred.resolve(response);
          } else {
            $timeout(function () {
              deferred.resolve(response);
            });
          }
        },
        fail = function (response) {
          if (sync) {
            deferred.reject(response);
          } else {
            $timeout(function () {
              deferred.reject(response);
            });
          }
        };

      args.push(success);
      args.push(fail);
      fn.apply(window.admob, args);
      return deferred.promise;
    };

    // The returning object
    angularAdmob = {
      events: {
        onAdLoaded: "appfeel.cordova.admob.onAdLoaded",
        onAdFailedToLoad: "appfeel.cordova.admob.onAdFailedToLoad",
        onAdOpened: "appfeel.cordova.admob.onAdOpened",
        onAdLeftApplication: "appfeel.cordova.admob.onAdLeftApplication",
        onAdClosed: "appfeel.cordova.admob.onAdClosed",
        onInAppPurchaseRequested: "appfeel.cordova.admob.onInAppPurchaseRequested"
      },
      AD_SIZE: {
        BANNER: 'BANNER',
        IAB_MRECT: 'IAB_MRECT',
        IAB_BANNER: 'IAB_BANNER',
        IAB_LEADERBOARD: 'IAB_LEADERBOARD',
        SMART_BANNER: 'SMART_BANNER'
      },
      AD_TYPE: {
        BANNER: 'banner',
        INTERSTITIAL: 'interstitial'
      },
      PURCHASE_RESOLUTION: {
        RESOLUTION_CANCELED: 2,
        RESOLUTION_FAILURE: 0,
        RESOLUTION_INVALID_PRODUCT: 3,
        RESOLUTION_SUCCESS: 1
      },
      options: options,
      eventPrefix: eventPrefix,
      setOptions: function (options) {
        return deviceready.promise.then(function () {
          return makePromise(admob.setOptions, [options]);
        });
      },
      setEventPrefix: function (prefix) {
        angularAdmob.eventPrefix = prefix;
      },
      createBannerView: function (options) {
        return deviceready.promise.then(function () {
          return makePromise(admob.createBannerView, [options]);
        });
      },
      showBannerAd: function (show) {
        return deviceready.promise.then(function () {
          return makePromise(admob.showBannerAd, [show]);
        });
      },
      destroyBannerView: function () {
        return deviceready.promise.then(function () {
          return makePromise(admob.destroyBannerView, []);
        });
      },
      requestInterstitialAd: function (options) {
        return deviceready.promise.then(function () {
          return makePromise(admob.requestInterstitialAd, [options]);
        });
      },
      showInterstitialAd: function () {
        return deviceready.promise.then(function () {
          return makePromise(admob.showInterstitialAd, []);
        });
      },
      recordResolution: function (purchaseId, resolution) {
        return deviceready.promise.then(function () {
          return makePromise(admob.recordResolution, [purchaseId, resolution]);
        });
      },
      recordPlayBillingResolution: function (purchaseId, billingResponseCode) {
        return deviceready.promise.then(function () {
          return makePromise(admob.recordPlayBillingResolution, [purchaseId, billingResponseCode]);
        });
      }
    };

    // Manage admob events
    function _onAdLoaded(e) {
      $rootScope.$broadcast(eventPrefix + admob.events.onAdLoaded, e);
    }

    function _onAdFailedToLoad(e) {
      $rootScope.$broadcast(angularAdmob.options.eventPrefix + admob.events.onAdFailedToLoad, e);
    }

    function _onAdOpened(e) {
      $rootScope.$broadcast(angularAdmob.options.eventPrefix + admob.events.onAdOpened, e);
    }

    function _onAdLeftApplication(e) {
      $rootScope.$broadcast(angularAdmob.options.eventPrefix + admob.events.onAdLeftApplication, e);
    }

    function _onAdClosed(e) {
      $rootScope.$broadcast(angularAdmob.options.eventPrefix + admob.events.onAdClosed, e);
    }

    function _onInAppPurchaseRequested(e) {
      $rootScope.$broadcast(angularAdmob.options.eventPrefix + admob.events.onInAppPurchaseRequested, e);
    }

    deviceready.promise.then(function () {
      var admobEvt;

      document.addEventListener(admob.events.onAdLoaded, _onAdLoaded, true);
      document.addEventListener(admob.events.onAdFailedToLoad, _onAdFailedToLoad, true);
      document.addEventListener(admob.events.onAdOpened, _onAdOpened, true);
      document.addEventListener(admob.events.onAdLeftApplication, _onAdLeftApplication, true);
      document.addEventListener(admob.events.onAdClosed, _onAdClosed, true);
      document.addEventListener(admob.events.onInAppPurchaseRequested, _onInAppPurchaseRequested, true);

      angularAdmob.AD_SIZE = admob.AD_SIZE;
      angularAdmob.AD_TYPE = admob.AD_TYPE;
      angularAdmob.PURCHASE_RESOLUTION = admob.PURCHASE_RESOLUTION;
      angularAdmob.options = admob.options;
      
      angularAdmob.setEventPrefix(eventPrefix);
    });
    
    /**
     * Resolves the deviceready promise. In this way admob methods are always executed when deviceready.
     */
    function onDeviceready() {
      deviceready.resolve();
      document.removeEventListener('deviceready', onDeviceready, false);
    }
    document.addEventListener('deviceready', onDeviceready, false);
    

    // Clean up
    $rootScope.$on('$destroy', function (event) {
      document.removeEventListener(admob.events.onAdLoaded, angularAdmob._onAdLoaded, true);
      document.removeEventListener(admob.events.onAdFailedToLoad, angularAdmob._onAdFailedToLoad, true);
      document.removeEventListener(admob.events.onAdOpened, angularAdmob._onAdOpened, true);
      document.removeEventListener(admob.events.onAdLeftApplication, angularAdmob._onAdLeftApplication, true);
      document.removeEventListener(admob.events.onAdClosed, angularAdmob._onAdClosed, true);
      document.removeEventListener(admob.events.onInAppPurchaseRequested, angularAdmob._onInAppPurchaseRequested, true);
    });


    return angularAdmob;
  }

  /**
   * This is the Angular provider for Admob.
   * @returns {Object} The provider.
   */
  function AdmobProvider() {
    'use strict';

    var eventPrefix = 'admob:',
      options = {};

    /**
     * Sets the event prefix. By default is set to 'admob:'.
     * @param {String} prefix The prefix for admob events.
     */
    this.setPrefix = function setPrefix(prefix) {
      eventPrefix = prefix;
    }

    /**
     * Sets admob options. They can be also set in run mode.
     * @param {Object} admobOptions Admob plugin options.
     */
    this.setOptions = function setOptions(admobOptions) {
      options = admobOptions;
      document.addEventListener('deviceready', function onDeviceready() {
        document.removeEventListener('deviceready', onDeviceready, false);
        admob.setOptions(admobOptions);
      }, false);
    }

    // expose to provider
    this.$get = ['$timeout', '$q', '$rootScope',
      function admobFactory($timeout, $q, $rootScope) {
        return new AdmobLauncher($timeout, $q, $rootScope, options, eventPrefix);
    }];
  }
  admobModule.provider('admobSvc', AdmobProvider);
}
