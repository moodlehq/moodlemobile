package com.alosistudio.elearningsmantri;

import android.annotation.SuppressLint;
import android.util.Log;

import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;

@SuppressLint("DefaultLocale")
public class AdMobAdsAdListener extends AdListener {
  private String adType = "";
  private AdMobAds admobAds;
  private boolean isBackFill = false;

  public AdMobAdsAdListener(String adType, AdMobAds admobAds, boolean isBackFill) {
    this.adType = adType;
    this.admobAds = admobAds;
    this.isBackFill = isBackFill;
  }

  @Override
  public void onAdLoaded() {
    admobAds.onAdLoaded(adType);
    admobAds.cordova.getActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        Log.d(AdMobAds.ADMOBADS_LOGTAG, adType + ": ad loaded");
        String event = String.format("javascript:cordova.fireDocumentEvent(admob.events.onAdLoaded, { 'adType': '%s' });", adType);
        admobAds.webView.loadUrl(event);
      }
    });
  }

  @Override
  public void onAdFailedToLoad(int errorCode) {
    if (this.isBackFill) {
      final int code = errorCode;
      admobAds.cordova.getActivity().runOnUiThread(new Runnable() {
        @Override
        public void run() {
          String reason = getErrorReason(code);
          Log.d(AdMobAds.ADMOBADS_LOGTAG, adType + ": fail to load ad (" + reason + ")");
          String event = String.format("javascript:cordova.fireDocumentEvent(admob.events.onAdFailedToLoad, { 'adType': '%s', 'error': %d, 'reason': '%s' });", adType, code, reason);
          admobAds.webView.loadUrl(event);
        }
      });
    } else {
      admobAds.tryBackfill(adType);
    }
  }

  /** Gets a string error reason from an error code. */
  public String getErrorReason(int errorCode) {
    String errorReason = "Unknown";
    switch (errorCode) {
    case AdRequest.ERROR_CODE_INTERNAL_ERROR:
      errorReason = "Internal error";
      break;
    case AdRequest.ERROR_CODE_INVALID_REQUEST:
      errorReason = "Invalid request";
      break;
    case AdRequest.ERROR_CODE_NETWORK_ERROR:
      errorReason = "Network Error";
      break;
    case AdRequest.ERROR_CODE_NO_FILL:
      errorReason = "No fill";
      break;
    }
    return errorReason;
  }

  @Override
  public void onAdOpened() {
    admobAds.onAdOpened(adType);
    admobAds.cordova.getActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        Log.d(AdMobAds.ADMOBADS_LOGTAG, adType + ": ad opened");
        String event = String.format("javascript:cordova.fireDocumentEvent(admob.events.onAdOpened, { 'adType': '%s' });", adType);
        admobAds.webView.loadUrl(event);
      }
    });
  }

  @Override
  public void onAdLeftApplication() {
    admobAds.cordova.getActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        Log.d(AdMobAds.ADMOBADS_LOGTAG, adType + ": left application");
        String event = String.format("javascript:cordova.fireDocumentEvent(admob.events.onAdLeftApplication, { 'adType': '%s' });", adType);
        admobAds.webView.loadUrl(event);
      }
    });
  }

  @Override
  public void onAdClosed() {
    admobAds.cordova.getActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        Log.d(AdMobAds.ADMOBADS_LOGTAG, adType + ": ad closed after clicking on it");
        String event = String.format("javascript:cordova.fireDocumentEvent(admob.events.onAdClosed, { 'adType': '%s' });", adType);
        admobAds.webView.loadUrl(event);
      }
    });
  }
}
