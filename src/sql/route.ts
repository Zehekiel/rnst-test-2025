import { createRoute } from '@hono/zod-openapi'
import { Tags } from '@/constant'
import { initSQlResponseSchema } from './schemas/response'

export const getInitSQLRoute = createRoute({
    method: 'get',
    path: '/init',
    tags:[Tags.database],
    description: 'Initialiser la base de données SQL',
    summary: 'Initialiser la base de données SQL',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: initSQlResponseSchema,
                },
            },
            description: 'Base de données initialisée',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})

export const deleteSQLRoute = createRoute({
    method: 'delete',
    path: '/delete',
    tags:[Tags.database],
    description: 'Supprimer la base de données SQL',
    summary: 'Supprimer la base de données SQL',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: initSQlResponseSchema,
                },
            },
            description: 'Base de données supprimée',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})

export const getCurrentDataRoute = createRoute({
    method: 'get',
    path: '/getCurrentUser',
    tags:[Tags.database],
    description: 'Obtenir l\'utilisateur actuel via les cookies',
    summary: 'Obtenir l\'utilisateur actuel',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: initSQlResponseSchema,
                },
            },
            description: 'Base de données supprimée',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})