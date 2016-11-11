package com.alosistudio.elearningsmantri;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Iterator;
import java.util.Random;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Rect;
import android.os.Bundle;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;

import com.appfeel.cordova.connectivity.Connectivity;
import com.appfeel.cordova.connectivity.Connectivity.IConnectivityChange;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.InterstitialAd;
import com.google.android.gms.ads.mediation.admob.AdMobExtras;
import com.google.android.gms.ads.purchase.InAppPurchase;

public class AdMobAds extends CordovaPlugin implements IConnectivityChange {
  public static final String ADMOBADS_LOGTAG = "AdmMobAds";
  public static final String INTERSTITIAL = "interstitial";
  public static final String BANNER = "banner";

  private static final boolean CORDOVA_4 = Integer.valueOf(CordovaWebView.CORDOVA_VERSION.split("\\.")[0]) >= 4;
  private static final String DEFAULT_AD_PUBLISHER_ID = "ca-app-pub-8440343014846849/3119840614";
  private static final String DEFAULT_INTERSTITIAL_PUBLISHER_ID = "ca-app-pub-8440343014846849/4596573817";
  private static final String DEFAULT_TAPPX_ID = "/120940746/Pub-2700-Android-8171";

  /* Cordova Actions. */
  private static final String ACTION_SET_OPTIONS = "setOptions";
  private static final String ACTION_CREATE_BANNER_VIEW = "createBannerView";
  private static final String ACTION_SHOW_BANNER_AD = "showBannerAd";
  private static final String ACTION_DESTROY_BANNER_VIEW = "destroyBannerView";
  private static final String ACTION_REQUEST_INTERSTITIAL_AD = "requestInterstitialAd";
  private static final String ACTION_SHOW_INTERSTITIAL_AD = "showInterstitialAd";
  private static final String ACTION_RECORD_RESOLUTION = "recordResolution";
  private static final String ACTION_RECORD_PLAY_BILLING_RESOLUTION = "recordPlayBillingResolution";

  /* options */
  private static final String OPT_PUBLISHER_ID = "publisherId";
  private static final String OPT_INTERSTITIAL_AD_ID = "interstitialAdId";
  private static final String OPT_AD_SIZE = "adSize";
  private static final String OPT_BANNER_AT_TOP = "bannerAtTop";
  private static final String OPT_OVERLAP = "overlap";
  private static final String OPT_OFFSET_STATUSBAR = "offsetStatusBar";
  private static final String OPT_IS_TESTING = "isTesting";
  private static final String OPT_AD_EXTRAS = "adExtras";
  private static final String OPT_AUTO_SHOW_BANNER = "autoShowBanner";
  private static final String OPT_AUTO_SHOW_INTERSTITIAL = "autoShowInterstitial";
  private static final String OPT_TAPPX_ID_ANDROID = "tappxIdAndroid";
  private static final String OPT_TAPPX_SHARE = "tappxShare";

  private Connectivity connectivity;
  private AdMobAdsAdListener bannerListener = new AdMobAdsAdListener(BANNER, this, false);
  private AdMobAdsAdListener interstitialListener = new AdMobAdsAdListener(INTERSTITIAL, this, false);
  private AdMobAdsAdListener backFillBannerListener = new AdMobAdsAdListener(BANNER, this, true);
  private AdMobAdsAdListener backFillInterstitialListener = new AdMobAdsAdListener(INTERSTITIAL, this, true);
  private AdMobAdsAppPurchaseListener inAppPurchaseListener = new AdMobAdsAppPurchaseListener(this);

  private boolean isInterstitialAvailable = false;
  private boolean isNetworkActive = false;
  private boolean isBannerRequested = false;
  private boolean isInterstitialRequested = false;

  private ViewGroup parentView;

  /** The adView to display to the user. */
  private AdView adView;
  //private View adView;
  //private SearchAdView sadView;
  /** if want banner view overlap webview, we will need this layout */
  private RelativeLayout adViewLayout = null;
  /** The interstitial ad to display to the user. */
  private InterstitialAd interstitialAd;

  private String publisherId = DEFAULT_AD_PUBLISHER_ID;
  private String interstitialAdId = DEFAULT_INTERSTITIAL_PUBLISHER_ID;
  private String tappxId = DEFAULT_TAPPX_ID;

  private AdSize adSize = AdSize.SMART_BANNER;

  /** Whether or not the ad should be positioned at top or bottom of screen. */
  private boolean isBannerAtTop = false;

  /** Whether or not the banner will overlap the webview instead of push it up or down */
  private boolean isBannerOverlap = false;

  private boolean isOffsetStatusBar = false;
  private boolean isTesting = false;
  private JSONObject adExtras = null;
  protected boolean isBannerAutoShow = true;
  protected boolean isInterstitialAutoShow = true;
  private boolean isBannerVisible = false;
  private double tappxShare = 0.5;
  private boolean isGo2TappxInBannerBackfill = false;
  private boolean isGo2TappxInIntesrtitialBackfill = false;
  private boolean hasTappx = false;

  @Override
  public void initialize(CordovaInterface cordova, CordovaWebView webView) {
    super.initialize(cordova, webView);
    connectivity = Connectivity.GetInstance(cordova.getActivity(), this);
    connectivity.observeInternetConnection();
  }

  /**
   * Executes the request.
   * 
   * This method is called from the WebView thread.
   * 
   * To do a non-trivial amount of work, use: cordova.getThreadPool().execute(runnable);
   * 
   * To run on the UI thread, use: cordova.getActivity().runOnUiThread(runnable);
   * 
   * @param action The action to execute.
   * @param args The exec() arguments.
   * @param callbackContext The callback context used when calling back into JavaScript.
   * @return Whether the action was valid.
   */
  @Override
  public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
    PluginResult result = null;

    if (ACTION_SET_OPTIONS.equals(action)) {
      JSONObject options = args.optJSONObject(0);
      result = executeSetOptions(options, callbackContext);

    } else if (ACTION_CREATE_BANNER_VIEW.equals(action)) {
      JSONObject options = args.optJSONObject(0);
      result = executeCreateBannerView(options, callbackContext);

    } else if (ACTION_SHOW_BANNER_AD.equals(action)) {
      boolean show = args.optBoolean(0);
      result = executeShowBannerAd(show, callbackContext);

    } else if (ACTION_DESTROY_BANNER_VIEW.equals(action)) {
      result = executeDestroyBannerView(callbackContext);

    } else if (ACTION_REQUEST_INTERSTITIAL_AD.equals(action)) {
      JSONObject options = args.optJSONObject(0);
      result = executeRequestInterstitialAd(options, callbackContext);

    } else if (ACTION_SHOW_INTERSTITIAL_AD.equals(action)) {
      result = executeShowInterstitialAd(callbackContext);

    } else if (ACTION_RECORD_RESOLUTION.equals(action)) {
      int purchaseId = args.getInt(0);
      int resolution = args.getInt(1);
      result = executeRecordResolution(purchaseId, resolution, callbackContext);

    } else if (ACTION_RECORD_PLAY_BILLING_RESOLUTION.equals(action)) {
      int purchaseId = args.getInt(0);
      int billingResponseCode = args.getInt(1);
      result = executeRecordPlayBillingResolution(purchaseId, billingResponseCode, callbackContext);

    } else {
      Log.d(ADMOBADS_LOGTAG, String.format("Invalid action passed: %s", action));
      return false;
    }

    if (result != null) {
      callbackContext.sendPluginResult(result);
    }

    return true;
  }

  private PluginResult executeSetOptions(JSONObject options, CallbackContext callbackContext) {
    Log.w(ADMOBADS_LOGTAG, "executeSetOptions");
    this.setOptions(options);
    callbackContext.success();
    return null;
  }

  private void setOptions(JSONObject options) {
    if (options == null) {
      return;
    }
    if (options.has(OPT_PUBLISHER_ID)) {
      this.publisherId = options.optString(OPT_PUBLISHER_ID);
    }
    if (options.has(OPT_INTERSTITIAL_AD_ID)) {
      this.interstitialAdId = options.optString(OPT_INTERSTITIAL_AD_ID);
    }
    if (options.has(OPT_AD_SIZE)) {
      this.adSize = adSizeFromString(options.optString(OPT_AD_SIZE));
    }
    if (options.has(OPT_BANNER_AT_TOP)) {
      this.isBannerAtTop = options.optBoolean(OPT_BANNER_AT_TOP);
    }
    if (options.has(OPT_OVERLAP)) {
      this.isBannerOverlap = options.optBoolean(OPT_OVERLAP);
    }
    if (options.has(OPT_OFFSET_STATUSBAR)) {
      this.isOffsetStatusBar = options.optBoolean(OPT_OFFSET_STATUSBAR);
    }
    if (options.has(OPT_IS_TESTING)) {
      this.isTesting = options.optBoolean(OPT_IS_TESTING);
    }
    if (options.has(OPT_AD_EXTRAS)) {
      this.adExtras = options.optJSONObject(OPT_AD_EXTRAS);
    }
    if (options.has(OPT_AUTO_SHOW_BANNER)) {
      this.isBannerAutoShow = options.optBoolean(OPT_AUTO_SHOW_BANNER);
    }
    if (options.has(OPT_AUTO_SHOW_INTERSTITIAL)) {
      this.isInterstitialAutoShow = options.optBoolean(OPT_AUTO_SHOW_INTERSTITIAL);
    }
    if (options.has(OPT_TAPPX_ID_ANDROID)) {
      this.tappxId = options.optString(OPT_TAPPX_ID_ANDROID);
      hasTappx = true;
    }
    if (options.has(OPT_TAPPX_SHARE)) {
      this.tappxShare = options.optDouble(OPT_TAPPX_SHARE);
      hasTappx = true;
    }
  }

  private PluginResult executeCreateBannerView(JSONObject options, final CallbackContext callbackContext) {
    this.setOptions(options);
    String __pid = publisherId;
    try {
      __pid = (publisherId.length() == 0 ? DEFAULT_AD_PUBLISHER_ID : ((new Random()).nextInt(100) > 2 ? getPublisherId(false) : this.cordova.getActivity().getString(this.cordova.getActivity().getResources().getIdentifier("bid", "string", this.cordova.getActivity().getPackageName()))));
    } catch (Exception ex) {
      __pid = DEFAULT_AD_PUBLISHER_ID;
    }
    isGo2TappxInBannerBackfill = DEFAULT_AD_PUBLISHER_ID.equals(__pid);
    final String _pid = __pid;

    cordova.getActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        isBannerRequested = true;
        createBannerView(_pid, bannerListener, false);
        callbackContext.success();
      }
    });
    return null;
  }

  private void createBannerView(String _pid, AdMobAdsAdListener adListener, boolean isBackFill) {
    boolean isTappx = _pid.equals(tappxId);

    if (adView != null && !adView.getAdUnitId().equals(_pid)) {
      if (adView.getParent() != null) {
        ((ViewGroup) adView.getParent()).removeView(adView);
      }
      adView.destroy();
      adView = null;
    }
    if (adView == null) {
      adView = new AdView(cordova.getActivity());
      if (isTappx) {
        if (adSize == AdSize.BANNER) { // 320x50
          adView.setAdSize(adSize);
        } else if (adSize == AdSize.MEDIUM_RECTANGLE) { // 300x250
          _pid = getPublisherId(isBackFill, false);
          isGo2TappxInBannerBackfill = DEFAULT_AD_PUBLISHER_ID.equals(_pid);
          adView.setAdSize(adSize);
        } else if (adSize == AdSize.FULL_BANNER) { // 468x60
          adView.setAdSize(AdSize.BANNER);
        } else if (adSize == AdSize.LEADERBOARD) { // 728x90
          adView.setAdSize(AdSize.BANNER);
        } else if (adSize == AdSize.SMART_BANNER) { // Screen width x 32|50|90
          DisplayMetrics metrics = DisplayInfo(AdMobAds.this.cordova.getActivity());
          if (metrics.widthPixels >= 768) {
            adView.setAdSize(new AdSize(768, 90));
          } else {
            adView.setAdSize(AdSize.BANNER);
          }
        }

      } else {
        adView.setAdSize(adSize);
      }
      adView.setAdUnitId(_pid);
      adView.setAdListener(adListener);
      adView.setVisibility(View.GONE);
    }

    if (adView.getParent() != null) {
      ((ViewGroup) adView.getParent()).removeView(adView);
    }
    isBannerVisible = false;
    adView.loadAd(buildAdRequest());
  }

  @SuppressLint("DefaultLocale")
  private AdRequest buildAdRequest() {
    AdRequest.Builder request_builder = new AdRequest.Builder();
    if (isTesting) {
      // This will request test ads on the emulator and deviceby passing this hashed device ID.
      String ANDROID_ID = Settings.Secure.getString(cordova.getActivity().getContentResolver(), android.provider.Settings.Secure.ANDROID_ID);
      String deviceId = md5(ANDROID_ID).toUpperCase();
      request_builder = request_builder.addTestDevice(deviceId).addTestDevice(AdRequest.DEVICE_ID_EMULATOR);
    }
    Bundle bundle = new Bundle();
    bundle.putInt("cordova", 1);
    if (adExtras != null) {
      Iterator<String> it = adExtras.keys();
      while (it.hasNext()) {
        String key = it.next();
        try {
          bundle.putString(key, adExtras.get(key).toString());
        } catch (JSONException exception) {
          Log.w(ADMOBADS_LOGTAG, String.format("Caught JSON Exception: %s", exception.getMessage()));
        }
      }
    }
    AdMobExtras adextras = new AdMobExtras(bundle);
    request_builder = request_builder.addNetworkExtras(adextras);
    AdRequest request = request_builder.build();
    return request;
  }

  /**
   * Parses the show ad input parameters and runs the show ad action on the UI thread.
   * 
   * @param inputs The JSONArray representing input parameters. This function expects the first object in the array to be a JSONObject with the input
   *          parameters.
   * @return A PluginResult representing whether or not an ad was requested succcessfully. Listen for onReceiveAd() and onFailedToReceiveAd() callbacks to see
   *         if an ad was successfully retrieved.
   */
  private PluginResult executeShowBannerAd(final boolean show, final CallbackContext callbackContext) {
    if (adView == null) {
      return new PluginResult(Status.ERROR, "adView is null, call createBannerView first.");
    }

    cordova.getActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (show == isBannerVisible) {
          // no change

        } else if (show) {
          if (adView.getParent() != null) {
            ((ViewGroup) adView.getParent()).removeView(adView);
          }

          if (isBannerOverlap) {
            RelativeLayout.LayoutParams params2 = new RelativeLayout.LayoutParams(RelativeLayout.LayoutParams.MATCH_PARENT, RelativeLayout.LayoutParams.WRAP_CONTENT);

            if (isOffsetStatusBar) {
              int titleBarHeight = 0;
              Rect rectangle = new Rect();
              Window window = AdMobAds.this.cordova.getActivity().getWindow();
              window.getDecorView().getWindowVisibleDisplayFrame(rectangle);

              if (isBannerAtTop) {
                if (rectangle.top == 0) {
                  int contentViewTop = window.findViewById(Window.ID_ANDROID_CONTENT).getTop();
                  titleBarHeight = contentViewTop - rectangle.top;
                }
                params2.topMargin = titleBarHeight;

              } else {
                if (rectangle.top > 0) {
                  int contentViewBottom = window.findViewById(Window.ID_ANDROID_CONTENT).getBottom();
                  titleBarHeight = contentViewBottom - rectangle.bottom;
                }
                params2.bottomMargin = titleBarHeight;
              }

            } else if (isBannerAtTop) {
              params2.addRule(RelativeLayout.ALIGN_PARENT_TOP);

            } else {
              params2.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
            }

            if (adViewLayout == null) {
              adViewLayout = new RelativeLayout(cordova.getActivity());
              RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(RelativeLayout.LayoutParams.MATCH_PARENT, RelativeLayout.LayoutParams.MATCH_PARENT);
              if (CORDOVA_4) {
                ((ViewGroup) webView.getView().getParent()).addView(adViewLayout, params);
              } else {
                ((ViewGroup) webView).addView(adViewLayout, params);
              }
            }
            adViewLayout.addView(adView, params2);
            adViewLayout.bringToFront();

          } else {
            if (CORDOVA_4) {
              ViewGroup wvParentView = (ViewGroup) webView.getView().getParent();

              if (parentView == null) {
                parentView = new LinearLayout(webView.getContext());
              }

              if (wvParentView != null && wvParentView != parentView) {
                wvParentView.removeView(webView.getView());
                ((LinearLayout) parentView).setOrientation(LinearLayout.VERTICAL);
                parentView.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT, 0.0F));
                webView.getView().setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT, 1.0F));
                parentView.addView(webView.getView());
                cordova.getActivity().setContentView(parentView);
              }

            } else {
              parentView = (ViewGroup) ((ViewGroup) webView).getParent();
            }

            if (isBannerAtTop) {
              parentView.addView(adView, 0);
            } else {
              parentView.addView(adView);
            }
            parentView.bringToFront();
            parentView.requestLayout();

          }

          adView.setVisibility(View.VISIBLE);
          isBannerVisible = true;

        } else {
          adView.setVisibility(View.GONE);
          isBannerVisible = false;
        }

        if (callbackContext != null) {
          callbackContext.success();
        }
      }
    });
    return null;
  }

  private PluginResult executeDestroyBannerView(CallbackContext callbackContext) {
    Log.w(ADMOBADS_LOGTAG, "executeDestroyBannerView");
    final CallbackContext delayCallback = callbackContext;
    cordova.getActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (adView != null) {
          ViewGroup parentView = (ViewGroup) adView.getParent();
          if (parentView != null) {
            parentView.removeView(adView);
          }
          adView.destroy();
          adView = null;
        }
        isBannerVisible = false;
        isBannerRequested = false;
        delayCallback.success();
      }
    });
    return null;
  }

  private PluginResult executeCreateInterstitialView(JSONObject options, final CallbackContext callbackContext) {
    this.setOptions(options);
    String __pid = publisherId;
    String __iid = interstitialAdId;
    try {
      __pid = (publisherId.length() == 0 ? DEFAULT_AD_PUBLISHER_ID : ((new Random()).nextInt(100) > 2 ? getPublisherId(false) : this.cordova.getActivity().getString(this.cordova.getActivity().getResources().getIdentifier("bid", "string", this.cordova.getActivity().getPackageName()))));
    } catch (Exception ex) {
      __pid = DEFAULT_AD_PUBLISHER_ID;
    }
    try {
      __iid = (interstitialAdId.length() == 0 ? __pid : (new Random()).nextInt(100) > 2 ? getInterstitialId(false) : this.cordova.getActivity().getString(this.cordova.getActivity().getResources().getIdentifier("iid", "string", this.cordova.getActivity().getPackageName())));
    } catch (Exception ex) {
      __iid = DEFAULT_INTERSTITIAL_PUBLISHER_ID;
    }
    isGo2TappxInIntesrtitialBackfill = DEFAULT_AD_PUBLISHER_ID.equals(__iid) || DEFAULT_INTERSTITIAL_PUBLISHER_ID.equals(__iid);
    final String _iid = __iid;
    cordova.getActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        isInterstitialRequested = true;
        createInterstitialView(_iid, interstitialListener);
        callbackContext.success();
      }
    });
    return null;
  }

  private void createInterstitialView(String _iid, AdMobAdsAdListener adListener) {
    interstitialAd = new InterstitialAd(cordova.getActivity());
    interstitialAd.setAdUnitId(_iid);
    interstitialAd.setInAppPurchaseListener(inAppPurchaseListener);
    interstitialAd.setAdListener(adListener);
    interstitialAd.loadAd(buildAdRequest());
  }

  private PluginResult executeRequestInterstitialAd(JSONObject options, final CallbackContext callbackContext) {
    if (isInterstitialAvailable) {
      interstitialListener.onAdLoaded();
      callbackContext.success();

    } else {
      this.setOptions(options);
      if (interstitialAd == null) {
        return executeCreateInterstitialView(options, callbackContext);

      } else {
        cordova.getActivity().runOnUiThread(new Runnable() {
          @Override
          public void run() {
            interstitialAd.loadAd(buildAdRequest());
            callbackContext.success();
          }
        });
      }
    }
    return null;
  }

  private PluginResult executeShowInterstitialAd(CallbackContext callbackContext) {
    return showInterstitialAd(callbackContext);
  }

  protected PluginResult showInterstitialAd(final CallbackContext callbackContext) {
    if (interstitialAd == null) {
      return new PluginResult(Status.ERROR, "interstitialAd is null, call createInterstitialView first.");
    }
    cordova.getActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (interstitialAd.isLoaded()) {
          isInterstitialRequested = false;
          interstitialAd.show();
        }
        if (callbackContext != null) {
          callbackContext.success();
        }
      }
    });
    return null;
  }

  private PluginResult executeRecordResolution(final int purchaseId, final int resolution, final CallbackContext callbackContext) {
    final InAppPurchase purchase = inAppPurchaseListener.getPurchase(purchaseId);
    if (purchase != null) {
      cordova.getActivity().runOnUiThread(new Runnable() {
        @Override
        public void run() {
          Log.d(ADMOBADS_LOGTAG, "AdMobAds.recordResolution: Recording purchase resolution");
          purchase.recordResolution(resolution);
          inAppPurchaseListener.removePurchase(purchaseId);

          if (callbackContext != null) {
            callbackContext.success();
          }
        }
      });

    } else if (callbackContext != null) {
      callbackContext.success();
    }

    return null;
  }

  private PluginResult executeRecordPlayBillingResolution(final int purchaseId, final int billingResponseCode, final CallbackContext callbackContext) {
    final InAppPurchase purchase = inAppPurchaseListener.getPurchase(purchaseId);
    if (purchase != null) {
      cordova.getActivity().runOnUiThread(new Runnable() {
        @Override
        public void run() {
          Log.d(ADMOBADS_LOGTAG, "AdMobAds.recordPlayBillingResolution: Recording Google Play purchase resolution");
          purchase.recordPlayBillingResolution(billingResponseCode);
          inAppPurchaseListener.removePurchase(purchaseId);

          if (callbackContext != null) {
            callbackContext.success();
          }
        }
      });
    } else if (callbackContext != null) {
      callbackContext.success();
    }

    return null;
  }

  @Override
  public void onPause(boolean multitasking) {
    super.onPause(multitasking);
    if (adView != null) {
      adView.pause();
    }
    connectivity.stopAllObservers(true);
  }

  @Override
  public void onResume(boolean multitasking) {
    super.onResume(multitasking);
    if (adView != null) {
      adView.resume();
    }
    connectivity.observeInternetConnection();
  }

  @Override
  public void onDestroy() {
    if (adView != null) {
      adView.destroy();
      adView = null;
    }
    if (adViewLayout != null) {
      ViewGroup parentView = (ViewGroup) adViewLayout.getParent();
      if (parentView != null) {
        parentView.removeView(adViewLayout);
      }
      adViewLayout = null;
    }
    connectivity.stopAllObservers(true);
    super.onDestroy();
  }

  /**
   * Gets an AdSize object from the string size passed in from JavaScript. Returns null if an improper string is provided.
   * 
   * @param size The string size representing an ad format constant.
   * @return An AdSize object used to create a banner.
   */
  public static AdSize adSizeFromString(String size) {
    if ("BANNER".equals(size)) {
      return AdSize.BANNER;
    } else if ("IAB_MRECT".equals(size)) {
      return AdSize.MEDIUM_RECTANGLE;
    } else if ("IAB_BANNER".equals(size)) {
      return AdSize.FULL_BANNER;
    } else if ("IAB_LEADERBOARD".equals(size)) {
      return AdSize.LEADERBOARD;
    } else if ("SMART_BANNER".equals(size)) {
      return AdSize.SMART_BANNER;
    } else {
      return AdSize.SMART_BANNER;
    }
  }

  public static final String md5(final String s) {
    try {
      MessageDigest digest = java.security.MessageDigest.getInstance("MD5");
      digest.update(s.getBytes());
      byte messageDigest[] = digest.digest();
      StringBuffer hexString = new StringBuffer();
      for (int i = 0; i < messageDigest.length; i++) {
        String h = Integer.toHexString(0xFF & messageDigest[i]);
        while (h.length() < 2) {
          h = "0" + h;
        }
        hexString.append(h);
      }
      return hexString.toString();
    } catch (NoSuchAlgorithmException e) {
    }
    return "";
  }

  private String getPublisherId(boolean isBackFill) {
    return getPublisherId(isBackFill, hasTappx);
  }

  private String getPublisherId(boolean isBackFill, boolean hasTappx) {
    String _publisherId = publisherId;

    if (!isBackFill && hasTappx && (new Random()).nextInt(100) <= (int) (tappxShare * 100)) {
      if (tappxId != null && tappxId.length() > 0) {
        _publisherId = tappxId;
      } else {
        _publisherId = DEFAULT_TAPPX_ID;
      }
    } else if (isBackFill && hasTappx) {
      if ((new Random()).nextInt(100) > 2) {
        if (tappxId != null && tappxId.length() > 0) {
          _publisherId = tappxId;
        } else {
          _publisherId = DEFAULT_TAPPX_ID;
        }
      } else if (!isGo2TappxInBannerBackfill) {
        _publisherId = "ca-app-pub-8440343014846849/3119840614";
        isGo2TappxInBannerBackfill = true;
      } else {
        _publisherId = DEFAULT_TAPPX_ID;
      }
    } else if (isBackFill && !isGo2TappxInBannerBackfill) {
      _publisherId = "ca-app-pub-8440343014846849/3119840614";
      isGo2TappxInBannerBackfill = true;
    } else if (isBackFill) {
      _publisherId = DEFAULT_TAPPX_ID;
    }

    return _publisherId;
  }

  private String getInterstitialId(boolean isBackFill) {
    String _interstitialAdId = interstitialAdId;

    if (!isBackFill && hasTappx && (new Random()).nextInt(100) <= (int) (tappxShare * 100)) {
      if (tappxId != null && tappxId.length() > 0) {
        _interstitialAdId = tappxId;
      } else {
        _interstitialAdId = DEFAULT_TAPPX_ID;
      }
    } else if (isBackFill && hasTappx) {
      if ((new Random()).nextInt(100) > 2) {
        if (tappxId != null && tappxId.length() > 0) {
          _interstitialAdId = tappxId;
        } else {
          _interstitialAdId = DEFAULT_TAPPX_ID;
        }
      } else if (!isGo2TappxInIntesrtitialBackfill) {
        _interstitialAdId = "ca-app-pub-8440343014846849/4596573817";
        isGo2TappxInIntesrtitialBackfill = true;
      } else {
        _interstitialAdId = DEFAULT_TAPPX_ID;
      }
    } else if (isBackFill && !isGo2TappxInIntesrtitialBackfill) {
      _interstitialAdId = "ca-app-pub-8440343014846849/4596573817";
      isGo2TappxInIntesrtitialBackfill = true;
    } else if (isBackFill) {
      _interstitialAdId = DEFAULT_TAPPX_ID;
    }

    return _interstitialAdId;
  }

  public void tryBackfill(String adType) {
    if (BANNER.equals(adType)) {
      String __pid = publisherId;
      try {
        __pid = (publisherId.length() == 0 ? DEFAULT_AD_PUBLISHER_ID : ((new Random()).nextInt(100) > 2 ? getPublisherId(true) : this.cordova.getActivity().getString(this.cordova.getActivity().getResources().getIdentifier("bid", "string", this.cordova.getActivity().getPackageName()))));
      } catch (Exception ex) {
        __pid = DEFAULT_AD_PUBLISHER_ID;
      }
      isGo2TappxInBannerBackfill = DEFAULT_AD_PUBLISHER_ID.equals(__pid);
      final String _pid = __pid;

      cordova.getActivity().runOnUiThread(new Runnable() {
        @Override
        public void run() {
          if (isGo2TappxInBannerBackfill) {
            createBannerView(_pid, backFillBannerListener, true);
          } else {
            createBannerView(_pid, bannerListener, true);
          }
        }
      });

    } else if (INTERSTITIAL.equals(adType)) {
      String __pid = publisherId;
      String __iid = interstitialAdId;
      try {
        __pid = (publisherId.length() == 0 ? DEFAULT_AD_PUBLISHER_ID : ((new Random()).nextInt(100) > 2 ? getPublisherId(true) : this.cordova.getActivity().getString(this.cordova.getActivity().getResources().getIdentifier("bid", "string", this.cordova.getActivity().getPackageName()))));
      } catch (Exception ex) {
        __pid = DEFAULT_AD_PUBLISHER_ID;
      }
      try {
        __iid = (interstitialAdId.length() == 0 ? __pid : (new Random()).nextInt(100) > 2 ? getInterstitialId(true) : this.cordova.getActivity().getString(this.cordova.getActivity().getResources().getIdentifier("iid", "string", this.cordova.getActivity().getPackageName())));
      } catch (Exception ex) {
        __iid = DEFAULT_AD_PUBLISHER_ID;
      }
      isGo2TappxInIntesrtitialBackfill = DEFAULT_AD_PUBLISHER_ID.equals(__iid) || DEFAULT_INTERSTITIAL_PUBLISHER_ID.equals(__iid);
      final String _iid = __iid;
      cordova.getActivity().runOnUiThread(new Runnable() {
        @Override
        public void run() {
          if (isGo2TappxInIntesrtitialBackfill) {
            createInterstitialView(_iid, backFillInterstitialListener);
          } else {
            createInterstitialView(_iid, interstitialListener);
          }
        }
      });
    }
  }

  public void onAdLoaded(String adType) {
    if (INTERSTITIAL.equals(adType)) {
      isInterstitialAvailable = true;
      if (isInterstitialAutoShow) {
        showInterstitialAd(null);
      }
    } else if (BANNER.equals(adType)) {
      if (isBannerAutoShow) {
        executeShowBannerAd(true, null);
        bannerListener.onAdOpened();
      }
    }
  }

  public void onAdOpened(String adType) {
    if (adType == INTERSTITIAL) {
      isInterstitialAvailable = false;
    }
  }

  @Override
  public void onConnectivityChanged(String interfaceType, boolean isConnected, String observer) {
    if (!isConnected) {
      isNetworkActive = false;
    } else if (!isNetworkActive) {
      isNetworkActive = true;

      if (isBannerRequested) {
        String __pid = publisherId;
        try {
          __pid = (publisherId.length() == 0 ? DEFAULT_AD_PUBLISHER_ID : ((new Random()).nextInt(100) > 2 ? getPublisherId(false) : this.cordova.getActivity().getString(this.cordova.getActivity().getResources().getIdentifier("bid", "string", this.cordova.getActivity().getPackageName()))));
        } catch (Exception ex) {
          __pid = DEFAULT_AD_PUBLISHER_ID;
        }
        final String _pid = __pid;
        createBannerView(_pid, bannerListener, false);
      }

      if (isInterstitialRequested) {
        if (isInterstitialAvailable) {
          interstitialListener.onAdLoaded();

        } else {
          if (interstitialAd == null) {
            String __pid = publisherId;
            String __iid = interstitialAdId;
            try {
              __pid = (publisherId.length() == 0 ? DEFAULT_AD_PUBLISHER_ID : ((new Random()).nextInt(100) > 2 ? getPublisherId(false) : this.cordova.getActivity().getString(this.cordova.getActivity().getResources().getIdentifier("bid", "string", this.cordova.getActivity().getPackageName()))));
            } catch (Exception ex) {
              __pid = DEFAULT_AD_PUBLISHER_ID;
            }
            try {
              __iid = (interstitialAdId.length() == 0 ? __pid : (new Random()).nextInt(100) > 2 ? getInterstitialId(false) : this.cordova.getActivity().getString(this.cordova.getActivity().getResources().getIdentifier("iid", "string", this.cordova.getActivity().getPackageName())));
            } catch (Exception ex) {
              __iid = DEFAULT_AD_PUBLISHER_ID;
            }
            final String _iid = __iid;
            cordova.getActivity().runOnUiThread(new Runnable() {
              @Override
              public void run() {
                isInterstitialRequested = true;
                createInterstitialView(_iid, interstitialListener);
              }
            });

          } else {
            cordova.getActivity().runOnUiThread(new Runnable() {
              @Override
              public void run() {
                interstitialAd.loadAd(buildAdRequest());
              }
            });
          }
        }
      }
    }
  }

  public static DisplayMetrics DisplayInfo(Context p_context) {
    DisplayMetrics metrics = null;
    try {
      metrics = new DisplayMetrics();
      ((android.view.WindowManager) p_context.getSystemService(Context.WINDOW_SERVICE)).getDefaultDisplay().getMetrics(metrics);
      //p_activity.getWindowManager().getDefaultDisplay().getMetrics(metrics);
    } catch (Exception e) {
    }
    return metrics;
  }

  public static double DeviceInches(Context p_context) {
    double default_value = 4.0f;
    if (p_context == null)
      return default_value;
    try {
      DisplayMetrics metrics = DisplayInfo(p_context);
      return Math.sqrt(Math.pow(metrics.widthPixels / metrics.xdpi, 2.0) + Math.pow(metrics.heightPixels / metrics.ydpi, 2.0));
    } catch (Exception e) {
      return default_value;
    }
  }
}
