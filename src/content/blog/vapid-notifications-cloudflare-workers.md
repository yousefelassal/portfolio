---
title: "Web Push Notifications on Cloudflare Workers"
summary: "Building web push notifications on Cloudflare Workers using VAPID and service workers."
date: "June 6 2026"
draft: false
tags:
  - Cloudflare Workers
  - PWA
  - Web Push
---

Here's the situation: you're building an internal dashboard tool, and every time a client does something your team needs to know. The obvious answer is "just send an email." But then you remember you have to pay for that, deal with deliverability, and wait for someone to actually check their inbox.

We went a different route. Our dashboard is a PWA, and we just install it on our phones. That's it. When a client does something, a push notification shows up on our phone instantly, exactly like any other app, zero third-party services. The browser vendors (Google, Mozilla, Apple) run the push infrastructure, and you're just allowed to use it for free.

---

## How It Actually Works

Web Push is built into every modern browser. The flow is:

1. The user grants notification permission
2. The browser creates a unique **push subscription** an endpoint URL + encryption keys, and hands it to you
3. You save that subscription to your database
4. Whenever you want to notify the user, your server POSTs an encrypted payload to that endpoint
5. The browser's push service (Google FCM, Mozilla, APNS, etc.) wakes up the device and delivers it to your service worker
6. Your service worker calls `showNotification()` and the notification appears

The push service infrastructure is run by browser vendors for free. You're just sending one HTTPS request per notification. No SDK, no monthly bill, no quotas to worry about.

---

## VAPID Keys: Generate Once, Keep Forever

VAPID (Voluntary Application Server Identification for Web Push) is the auth layer that proves to the push service that _you_ are the one sending the notification. It's a public/private key pair.

Generate them:

```bash
npx web-push generate-vapid-keys
```

Output:

```
Public Key:
some-public-key

Private Key:
some-private-key
```

Important: **generate these once and never regenerate them.** The public key gets baked into every browser subscription.

- **Public key** → goes in your frontend code, safe to commit
- **Private key** → lives in your server environment variables, never touches the frontend

Add them to your Worker:

```bash
wrangler secret put VAPID_PUBLIC_KEY
wrangler secret put VAPID_PRIVATE_KEY
```

---

## The Service Worker

Your PWA needs a service worker to receive push events. Even when the app isn't open, the service worker is alive in the background listening.

```ts
// sw.ts
/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  let payload: { title: string; body: string; data?: { url: string } };

  try {
    payload = event.data.json();
  } catch {
    console.error("[SW] Failed to parse push payload", event.data.text());
    return;
  }

  const { title, body, data } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      data,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url: string = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url === url);
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      }),
  );
});
```

We use `vite-plugin-pwa` to register the service worker automatically. If you're on Vite, add it to your config:

```ts
// vite.config.ts
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "app",
      filename: "sw.ts",
    }),
  ],
});
```

---

## The Frontend: Subscribe Hook

This React hook handles the full subscribe/unsubscribe lifecycle. The key part is calling `pushManager.subscribe()` with your VAPID public key the browser uses it to generate a subscription that's cryptographically tied to your server.

```ts
// use-push-notifications.ts

// Your VAPID public key safe to hardcode, it's public
const PUBLIC_KEY = "some-public-key";

export function usePushNotifications(): UsePushNotificationsReturn {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    subscription: null,
    isSubscribed: false,
    isLoading: false,
    isPending: true,
    error: null,
  });

  useEffect(() => {
    const checkSupport = async () => {
      const isSupported =
        "serviceWorker" in navigator && "PushManager" in window;
      setState((prev) => ({ ...prev, isSupported }));

      if (isSupported) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        const subscriptionId = localStorage.getItem("pushSubscriptionId")!;

        // verify the subscription is still active on the server
        const { data } = await api.get("/push-notifications/status", {
          params: { subscriptionId },
        });

        setState((prev) => ({
          ...prev,
          subscription,
          isSubscribed: !!subscription && !!data?.enabled,
          isPending: false,
        }));
      }
    };

    void checkSupport();
  }, []);

  const subscribe = async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const permission = await Notification.requestPermission();
    if (permission !== "granted")
      throw new Error("Notification permission denied");

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
    });

    // save the subscription to your backend
    const { data } = await api.post("/push-notifications/subscribe", {
      subscription,
    });

    // store the subscription ID so we can check/remove it later
    localStorage.setItem("pushSubscriptionId", data.subscriptionId);

    setState((prev) => ({
      ...prev,
      subscription,
      isSubscribed: true,
      isLoading: false,
    }));
  };

  const unsubscribe = async (): Promise<void> => {
    if (!state.subscription) return;

    await state.subscription.unsubscribe();

    const subscriptionId = localStorage.getItem("pushSubscriptionId");
    if (subscriptionId) {
      await api.post("/op/push-notifications/unsubscribe", { subscriptionId });
      localStorage.removeItem("pushSubscriptionId");
    }

    setState((prev) => ({
      ...prev,
      subscription: null,
      isSubscribed: false,
      isLoading: false,
    }));
  };

  return { ...state, subscribe, unsubscribe };
}
```

When the user subscribes, the browser generates a `PushSubscription` object:

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/some-device-token",
  "expirationTime": null,
  "keys": {
    "p256dh": "BNaR...",
    "auth": "tBH..."
  }
}
```

That `endpoint` is the URL your server will POST to. The `keys` are for end-to-end encryption. Save the whole object to your database.

---

## The Backend: Subscription Routes

Three routes to manage subscriptions on the Cloudflare Worker:

```ts
// push-notification.route.ts

// GET /push-notifications/status
pushNotifications.get("/status", async (c) => {
  const { subscriptionId } = c.req.valid("query");

  // query your database to check if the subscription is still active
  const subscription = await isSubscriptionActive(subscriptionId);

  return c.json({ enabled: !!subscription });
});

// POST /push-notifications/subscribe
pushNotifications.post("/subscribe", async (c) => {
  const { subscription } = await c.req.json();
  const subscriptionId = crypto.randomUUID();

  // parse the User-Agent so we know what device this subscription is from
  const ua = UAParser(c.req.header("user-agent") || "");
  const ip = c.req.header("cf-connecting-ip") || "";

  // insert the subscription into your database
  await saveSubscription(subscriptionId, subscription, { ...ua, ip });

  return c.json({ success: true, subscriptionId }, 201);
});

// POST /push-notifications/unsubscribe
pushNotifications.post("/unsubscribe", async (c) => {
  const { subscriptionId } = c.req.valid("json");

  // remove the subscription from your database
  await removeSubscription(subscriptionId);

  return c.json({ success: true });
});
```

---

## The Backend: Sending Notifications

We use `@block65/webcrypto-web-push` which runs natively on the Workers runtime (no Node.js crypto needed). It handles ECDH encryption and VAPID JWT signing you just hand it the message and subscription and it gives back a `RequestInit` ready for `fetch`.

### Notification Templates

```ts
// push-notification.service.ts
import { buildPushPayload } from "@block65/webcrypto-web-push";
import type { PushMessage, VapidKeys } from "@block65/webcrypto-web-push";

const vapid: VapidKeys = {
  subject: env.APP_URL,
  publicKey: env.VAPID_PUBLIC_KEY,
  privateKey: env.VAPID_PRIVATE_KEY,
};

type NotificationType = /* your notification types */

const notificationTemplates: Record<
  NotificationType,
  { title: string; body: string; url: string }
> = {
  "example": {
    title: "Example Notification",
    body: "Example for {placeholder}",
    url: "/example",
  },
};

export const preparePushNotification = (
  type: NotificationType,
  options?: {
    /* the subject where the notification will be sent */
    subject?: number;
    /* the placeholder to replace in the notification body */
    placeholder?: string;
  },
): PushNotificationMessage => {
  const { title, body, url } = notificationTemplates[type];
  return {
    data: {
      title,
      body: body.replace("{placeholder}", options?.placeholder ?? ""),
      data: { url: options?.subject ? `${url}/${options.subject}` : url },
    },
  };
};
```

### Sending to All Subscribers

```ts
export const triggerPushNotificationToSubscribers = async (
  message: PushNotificationMessage,
): Promise<void> => {
  // fetch all subscribers from the database
  const subscribers = await getSubscribers();

  return triggerPushNotification(
    subscribers.map((u) => u.id),
    message,
  );
};

export const triggerPushNotification = async (
  userIds: number[],
  message: PushNotificationMessage,
): Promise<void> => {
  // fetch all subscriptions for the given userIds
  const subscriptions = await getSubscriptions(userIds);

  if (!subscriptions?.length) return;

  const promises = subscriptions.map(async (sub) => {
    if (!sub.vapidSubscription) return;

    const payload = await buildPushPayload(
      message,
      sub.vapidSubscription,
      vapid,
    );

    try {
      const res = await fetch(
        sub.vapidSubscription.endpoint,
        payload as RequestInit,
      );
      ctxLogger.debug("Push sent", { status: res.status });
    } catch (error) {
      ctxLogger.error("Error sending push notification:", error);
    }
  });

  // allSettled so one expired subscription doesn't block the rest
  await Promise.allSettled(promises);
};
```

`Promise.allSettled` instead of `Promise.all` if one subscription is expired or the push service returns a 410, we still notify everyone else. Don't let one bad subscription kill the whole batch.

---

## `waitUntil`: The Cloudflare Workers Thing You Need to Know

This is the part that trips people up when they first move to Workers.

In a long-lived server process, you can fire an async function without awaiting it and it'll run in the background fine. **Cloudflare Workers are not long-lived.** Once a Worker returns a Response, its execution context can be torn down immediately. Any unfinished async work including your push notification fetch gets killed silently.

`c.executionCtx.waitUntil()` is how you tell the runtime "I'm done with the response, but keep this Worker alive until this promise settles."

```ts
// some logic
const someLogicResult = await someLogic(body);

// fire the notification in the background user doesn't need to wait to receive a response
c.executionCtx.waitUntil(
  triggerPushNotificationToSubscribers(
    preparePushNotification("example", {
      subject: someLogicResult.id,
      placeholder: someLogicResult.title,
    }),
  ),
);

// response goes back to the client immediately
return c.json({ someLogicResult });
```

The user gets their response instantly. The push notifications go out in the background. Without `waitUntil`, the notifications would silently fail on most requests no error, no log, just nothing delivered.

---

## The Full Picture

Install the PWA on your phone. Grant notification permission. Now every time a client creates a request, your phone buzzes same as any native app. No email service, no Slack integration, no webhook bill. Just a `fetch()` to a URL the browser gave us, authenticated with a key pair we generated with one `npx` command.

```
Client creates a request
  └── POST /api/v1/client/requests
        ├── insert into DB ──────────────────────── await (user waits for this)
        ├── return c.json({ id }) ───────────────── response sent to client
        └── c.executionCtx.waitUntil(...)           (Worker stays alive)
              └── triggerPushNotificationToSubscribers()
                    ├── query active subscribers from DB
                    ├── query their push subscriptions
                    └── for each subscription:
                          ├── buildPushPayload()  ECDH encrypt + VAPID sign
                          └── fetch(subscription.endpoint, payload)
                                └── Google FCM / Mozilla / Apple push service
                                      └── device wakes up
                                            └── service worker 'push' event
                                                  └── showNotification("New Request")
                                                        └── 📱 notification on phone
```

---

## A Few Things Worth Knowing

**The public VAPID key is safe to hardcode in your frontend.** It's a public key it's in your JavaScript bundle that anyone can read anyway. The private key is what you protect.

**Don't regenerate VAPID keys unless you absolutely have to.** All existing subscriptions will break and users will stop getting notifications silently until they re-subscribe.

**Subscriptions expire.** If a user clears their browser data or the push service invalidates the subscription, you'll get a `410 Gone` back when you try to send. You should clean those up from your DB. Log the status code at minimum.

**Safari on iOS requires the PWA to be added to the home screen.** It won't grant push permission from a browser tab. For an internal team tool that's fine just add it to your home screen like you would any app. iOS 16.4+ required.

**One subscription per browser per device.** Team member with Chrome on their laptop and the PWA installed on their phone? Two subscriptions, both get notified. Usually exactly what you want.
