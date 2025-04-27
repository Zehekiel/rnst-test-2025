import { serve } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'
import { SwaggerUI } from '@hono/swagger-ui'
import analysis from '@/analyses/index';
import project from '@/projects/index';
import connection from '@/connection/index';
import 'dotenv/config';
import { getSignedCookie } from 'hono/cookie';
import { cookieName, secret } from './constant';
import { checkCookiesMiddleware } from './middleware/cookie';
import databaseRoute from '@/sql/index';
import usersRoute from './users';

const app = new OpenAPIHono()

app.use(checkCookiesMiddleware)

app.route('/connection', connection);
app.route('/', analysis);
app.route('/projects', project);
app.route('/database', databaseRoute);
app.route('/users', usersRoute);

app.doc('/doc', {
    openapi: '3.0.0',
    info: {
        version: '1.0.0',
        title: '',
        description: 'Documentation API de pour le projet de test RNEST',
    },
})


app.get('/ui', async (c) => {
    const cookie = await getSignedCookie(c, secret)

    return c.html(`
        <html lang="en">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="description" content="RNEST-Test" />
                <title>RNEST-Test</title>
                <style>
                    button {
                        background-color: transparent; 
                        padding:4px;
                        color: white; 
                        border: 0px; 
                        cursor: pointer
                    }
                    .header {
                        display: flex;
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;
                        background-color: #100547;
                        padding: 8px 16px;
                        margin: 0 16px;
                        border-radius: 8px;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    }
                    .title {
                        color: white;
                        font-family: sans-serif
                    }
                    .buttons {
                        display: flex;
                        flex-direction: row;
                        gap: 16px;
                        align-items: center;
                    }
                </style>
                <div class="header">
                    <h1 class="title" >RNEST-Test</h1>
                    <div class="buttons">
                        <button onclick="window.location.href='/doc'">Documentation</button>
                        <button onclick="window.location.href='/ui'">Swagger</button>
                        <button 
                            id="connectionButton" 
                            onclick=${cookie[cookieName] ? "window.location.href='/connection/logout'" : "window.location.href='/connection/github'"}
                            >
                                ${cookie[cookieName] ? "Connecté" : "Connexion"}
                            </button>
                    </div>
                </div>
            </head>
            <body>
                ${SwaggerUI({ url: '/doc', oauth2RedirectUrl: process.env.GITHUB_REDIRECT_URI })}
            </body>
        </html>
    `)
})

const port = 3000

console.log(`Server is running on http://localhost:${port}`)

serve({
    fetch: app.fetch,
    port
})
