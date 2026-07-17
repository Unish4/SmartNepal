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

    navigator.serviceWorker.getRegistration()
      .then((reg) => {
        if (reg) {
          return reg.pushManager.getSubscription();
        }
        return null;
      })
      .then((sub) => {
        setIsSubscribed(!!sub);
      })
      .catch((err) => {
        console.error("Error checking push subscription status:", err);
        setIsSubscribed(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const subscribe = useCallback(async () => {
    const { publicKey, configured } = await fetchVapidPublicKey();
    if (!configured)
      throw new Error("Push notifications are not configured on the server");

    let permission = Notification.permission;
    if (permission !== "granted") {
      try {
        permission = await Notification.requestPermission();
      } catch {
        permission = await new Promise((resolve) => {
          Notification.requestPermission(resolve);
        });
      }
    }
    if (permission !== "granted")
      throw new Error("Notification permission was not granted");

    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration || !registration.active) {
      const readyPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Service worker activation timed out")), 5000)
      );
      registration = await Promise.race([readyPromise, timeoutPromise]);
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
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      const readyPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Service worker activation timed out")), 5000)
      );
      registration = await Promise.race([readyPromise, timeoutPromise]);
    }
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await unsubscribePushRequest(subscription.endpoint);
      await subscription.unsubscribe();
    }
    setIsSubscribed(false);
  }, []);

  return { isSupported, isSubscribed, isLoading, subscribe, unsubscribe };
};
