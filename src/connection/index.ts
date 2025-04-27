import { githubAuth } from '@hono/oauth-providers/github'
import { OpenAPIHono } from '@hono/zod-openapi'
import { getGithubRoute } from './route'
import { Hono } from 'hono'

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

connection.get("github", (c) => {
    const token = c.get('token')
    const user = c.get('user-github')
    
    return c.redirect("/ui")
})

export default connection