import { useState, useEffect, useCallback } from "react";
import {
  fetchVapidPublicKey,
  subscribePushRequest,
  unsubscribePushRequest,
} from "../services/pushService.js";
import { urlBase64ToUint8Array } from "../lib/pushUtils.js";

export const usePushSubscription = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let supported = false;
    try {
      supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
    } catch (err) {
      console.error("Push notification support check failed:", err);
    }
    setIsSupported(supported);
    if (!supported) {
      setIsLoading(false);
      return;
    }

    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (reg) {
          return reg.pushManager.getSubscription();
        }
        return null;
      })
      .then((sub) => setIsSubscribed(!!sub))
      .catch((err) => {
        console.error("Error checking push subscription status:", err);
        setIsSubscribed(false);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const subscribe = useCallback(async () => {
    const { publicKey, configured } = await fetchVapidPublicKey();
    if (!configured)
      throw new Error("Push notifications are not configured on the server");

    const permission = await Notification.requestPermission();
    if (permission !== "granted")
      throw new Error("Notification permission was not granted");

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration?.active) {
      throw new Error("Push notifications are not ready on this device");
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    const json = subscription.toJSON();
    await subscribePushRequest({ endpoint: json.endpoint, keys: json.keys });
    setIsSubscribed(true);
  }, []);

  const unsubscribe = useCallback(async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await unsubscribePushRequest(subscription.endpoint);
      await subscription.unsubscribe();
    }
    setIsSubscribed(false);
  }, []);

  return { isSupported, isSubscribed, isLoading, subscribe, unsubscribe };
};
