import { onRequestOptions as __api_contact_ts_onRequestOptions } from "/Users/dikshant/Documents/personal/dikshant-blog-boost/functions/api/contact.ts"
import { onRequestPost as __api_contact_ts_onRequestPost } from "/Users/dikshant/Documents/personal/dikshant-blog-boost/functions/api/contact.ts"
import { onRequestOptions as __newsletter_subscribe_js_onRequestOptions } from "/Users/dikshant/Documents/personal/dikshant-blog-boost/functions/newsletter-subscribe.js"
import { onRequestPost as __newsletter_subscribe_js_onRequestPost } from "/Users/dikshant/Documents/personal/dikshant-blog-boost/functions/newsletter-subscribe.js"

export const routes = [
    {
      routePath: "/api/contact",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_contact_ts_onRequestOptions],
    },
  {
      routePath: "/api/contact",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_contact_ts_onRequestPost],
    },
  {
      routePath: "/newsletter-subscribe",
      mountPath: "/",
      method: "OPTIONS",
      middlewares: [],
      modules: [__newsletter_subscribe_js_onRequestOptions],
    },
  {
      routePath: "/newsletter-subscribe",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__newsletter_subscribe_js_onRequestPost],
    },
  ]