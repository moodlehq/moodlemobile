package com.alosistudio.elearningsmantri;

import android.annotation.SuppressLint;
import android.util.Log;
import android.util.SparseArray;

import com.google.android.gms.ads.purchase.InAppPurchase;
import com.google.android.gms.ads.purchase.InAppPurchaseListener;

@SuppressLint("DefaultLocale")
public class AdMobAdsAppPurchaseListener implements InAppPurchaseListener {
  private AdMobAds admobAds;
  private static int purchaseId = 0;
  private SparseArray<InAppPurchase> purchases = new SparseArray<InAppPurchase>();

  public AdMobAdsAppPurchaseListener(AdMobAds admobAds) {
    this.admobAds = admobAds;
  }

  @Override
  synchronized public void onInAppPurchaseRequested(final InAppPurchase inAppPurchase) {
    admobAds.cordova.getActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        Log.d(AdMobAds.ADMOBADS_LOGTAG, "AdMobAdsAppPurchaseListener.onInAppPurchaseRequested: In app purchase. SKU: " + inAppPurchase.getProductId());
        purchases.put(purchaseId, inAppPurchase);
        String event = String.format("javascript:cordova.fireDocumentEvent(admob.events.onInAppPurchaseRequested, { 'purchaseId': %d, 'productId': '%s' });", purchaseId, inAppPurchase.getProductId());
        admobAds.webView.loadUrl(event);
        purchaseId++;
      }
    });
  }

  public InAppPurchase getPurchase(int purchaseId) {
    return purchases.get(purchaseId);
  }

  public void removePurchase(int purchaseId) {
    purchases.remove(purchaseId);
  }

}
