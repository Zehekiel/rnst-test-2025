import { cookieName, secret } from '@/constant'
import { githubAuth } from '@hono/oauth-providers/github'
import { Hono } from 'hono'
import {deleteCookie, setSignedCookie} from 'hono/cookie'

const connection = new Hono()

connection.use(
    '/github',
    githubAuth({
        client_id: process.env.GITHUB_ID,
        client_secret: process.env.GITHUB_SECRET,
        scope: ['read:user', 'user'],
        oauthApp: true,
        redirect_uri: process.env.GITHUB_REDIRECT_URI
    })
)

connection.get("/github", async  (c) => {
    const user = c.get('user-github')
    const cookieValue = JSON.stringify({id: user?.id, name: user?.login})
    const cookieOption = {
        path: '/',
        secure: true,
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
    }
    // documentation: https://hono.dev/docs/helpers/cookie#secure-and-host-prefix
    await setSignedCookie(
        c, 
        cookieName, 
        cookieValue,
        secret,
        cookieOption
        )

    return c.redirect("/ui")
})

connection.get('logout', async (c) => {
    deleteCookie(
        c, 
        cookieName, 
    )

    return c.redirect("/ui")
})

export default connection