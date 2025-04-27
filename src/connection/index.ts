import { githubAuth } from '@hono/oauth-providers/github'
import { Hono } from 'hono'
import {setSignedCookie} from 'hono/cookie'

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

connection.get("github", async  (c) => {
    const user = c.get('user-github')
    const cookieName = 'rnest_user'
    const cookieValue = JSON.stringify({id: user?.id, name: user?.login})
    if (process.env.GITHUB_SECRET === undefined) {
        throw new Error("GITHUB_SECRET is not defined")
    }
    await setSignedCookie(c, cookieName, cookieValue, process.env.GITHUB_SECRET)

    return c.redirect("/ui")
})

export default connection