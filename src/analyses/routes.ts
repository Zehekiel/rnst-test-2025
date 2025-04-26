import { createRoute } from '@hono/zod-openapi'
import { Tags } from '../constant.js'
import { analysesResponseSchema, analysisResponseSchema, postAnalysisResponseSchema } from './schemas/response.js'
import { getAnalysesQuerySchema, getAnalysisQuerySchema, postAnalysisBodySchema } from './schemas/request.js'


export const getAnalysesRoute = createRoute({
    method: 'get',
    path: 'projects/{projectId}/analyses',
    tags:[Tags.analysis],
    description: 'Récupérer toutes les analyses dans la base de données accessible par l’utilisateur connecté',
    summary: 'Récupérer toutes les analyses',
    request: {
        params: getAnalysesQuerySchema,
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: analysesResponseSchema,
                },
            },
            description: 'Récupérer toutes les analyses',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})

export const getAnalysisRoute = createRoute({
    method: 'get',
    path: 'projects/{projectId}/analyses/{analysisId}',
    tags:[Tags.analysis],
    description: "Récupérer une analyse d'un projet dans la base de données accessible par l’utilisateur connecté",
    summary: 'Récupérer une analyse',
    request: {
        params: getAnalysisQuerySchema,
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: analysisResponseSchema,
                },
            },
            description: "Récupérer l'id d'une analyse",
        },
        401: {
            description: 'Unauthorized',
        },
    },
})

export const postAnalysisRoute = createRoute({
    method: 'post',
    path: 'projects/{projectId}/analyses',
    tags: [Tags.analysis],
    description: "Créer une analyse au sein d'un projet",
    summary: 'Créer une analyse',
    request: {
        params: getAnalysesQuerySchema,
        body: {
            content: {
                'application/json': {
                    schema: postAnalysisBodySchema,
                },
            },
            required: true,
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: postAnalysisResponseSchema,
                },
            },
            description: 'Analyse créée',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})