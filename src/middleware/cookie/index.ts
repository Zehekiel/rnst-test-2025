import { secret } from '@/constant';
import { Context, Next } from 'hono';
import { getSignedCookie } from 'hono/cookie';

function haveCookie(obj: object): boolean {
    return Object.keys(obj).length > 0;
}

export async function checkCookiesMiddleware(c: Context, next: Next) {
    console.log('Middleware checkCookiesMiddleware executed');

    // Récupérer la valeur d'un cookie spécifique
    const cookie = await getSignedCookie(c, secret)

    if (haveCookie(cookie)) {
        await next();
    } else if (c.req.url.includes("connection") || c.req.url.endsWith("ui") || c.req.url.endsWith("doc")) {
        await next();
    } else {
        return c.json({
            success: false,
            message: "you have to login",
        }, 401);
    }
}
