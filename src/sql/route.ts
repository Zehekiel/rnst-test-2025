import { createRoute } from '@hono/zod-openapi'
import { Tags } from '@/constant'
import { deleteSQlResponseSchema, getAllAnalysisResponseSchema, getAllProjectResponseSchema, initSQlResponseSchema } from './schemas/response'

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
                    schema: deleteSQlResponseSchema,
                },
            },
            description: 'Base de données supprimée',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})

export const getAllProjectRoute = createRoute({
    method: 'get',
    path: '/projects',
    tags:[Tags.database],
    description: 'Obtenir tous les projets dans la base de données',
    summary: 'Obtenir tous les projets',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: getAllProjectResponseSchema,
                },
            },
            description: 'Base de données supprimée',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})

export const getAllAnalysisRoute = createRoute({
    method: 'get',
    path: '/analyses',
    tags:[Tags.database],
    description: 'Obtenir toutes les analyses dans la base de données',
    summary: 'Obtenir toutes les analyses',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: getAllAnalysisResponseSchema,
                },
            },
            description: 'Base de données supprimée',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})
