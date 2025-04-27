import { cookieName, secret } from '@/constant';
import { Context, Next } from 'hono';
import { getSignedCookie } from 'hono/cookie';

function haveCookie(cookie: { [key: string]: Record<string, unknown> | string | number | boolean }): boolean {
    if(Object.keys(cookie).length > 0 && cookie[cookieName] !== false) {
        return true
    } else {
        return false
    }
}

export async function checkCookiesMiddleware(c: Context, next: Next) {
    console.log("checkCookiesMiddleware executed")

    const cookie = await getSignedCookie(c, secret)
    const isUrlException= c.req.url.includes("connection") || c.req.url.endsWith("ui") || c.req.url.endsWith("doc")
    const isHaveCookie = haveCookie(cookie)
    if (isHaveCookie) {
        await next();
    } else if (isUrlException) {
        await next();
    } else {
        console.warn("🚀 ~ checkCookiesMiddleware ~ isHaveCookie:", isHaveCookie)
        console.warn("🚀 ~ checkCookiesMiddleware ~ isUrlException:", isUrlException)
        return c.json({
            success: false,
            message: "you have to login",
        }, 401);
    }
}
