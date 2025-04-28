import { createRoute } from '@hono/zod-openapi'
import { Tags } from '@/constant'
import { getUserAnalyseResponseSchema, getUserDataResponseSchema, getUserProjectResponseSchema, getUserRoleResponseSchema } from './schemas/response'
import { getUserAnalyseParamSchema, getUserAuthorizationParamSchema, getUserProjectParamSchema, getUserRoleParamSchema } from './schemas/request'


export const getCurrentDataRoute = createRoute({
    method: 'get',
    path: '/',
    tags:[Tags.users],
    description: 'Obtenir l\'utilisateur actuel via les cookies',
    summary: 'Obtenir l\'utilisateur actuel',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: getUserDataResponseSchema,
                },
            },
            description: 'Utilisateur actuel',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})

export const getUserRoleRoute = createRoute({
    method: 'get',
    path: '/{userId}/project/{projectId}/analyse/{analysisId}',
    tags:[Tags.users],
    description: 'Obtenir le rôle d\'un utilisateur',
    summary: 'Obtenir le rôle d\'un utilisateur',
    request: {
            params: getUserRoleParamSchema,
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: getUserRoleResponseSchema,
                },
            },
            description: 'Rôle de l\'utilisateur',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})

export const getUserAuthorizationRoute = createRoute({
    method: 'get',
    path: '/{userId}/project/{projectId}/analyse/{analysisId}/action/{action}',
    tags:[Tags.users],
    description: 'Savoir si l\'utilisateur a le droit d\'effectuer une action en fonction de son rôle dans le projet ou l\'analyse',
    summary: 'Savoir si l\'utilisateur a le droit d\'effectuer une action',
    request: {
            params: getUserAuthorizationParamSchema,
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: getUserRoleResponseSchema,
                },
            },
            description: 'Rôle de l\'utilisateur',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})

export const getUserProjectRoute = createRoute({
    method: 'get',
    path: '/{userId}/project',
    tags:[Tags.users],
    description: 'Obtenir les projets qu\'un utilisateur a droit de consulter',
    summary: 'Obtenir les projets d\'un utilisateur',
    request: {
        params: getUserProjectParamSchema,
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: getUserProjectResponseSchema,
                },
            },
            description: 'Projets de l\'utilisateur',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})

export const getUserAnalyseRoute = createRoute({
    method: 'get',
    path: '/{userId}/project/{projectId}/analyse',
    tags:[Tags.users],
    description: 'Obtenir les analyses qu\'un utilisateur a droit de consulter par rapport un projet',
    summary: 'Obtenir les analyses d\'un utilisateur',
    request: {
        params: getUserAnalyseParamSchema,
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: getUserAnalyseResponseSchema,
                },
            },
            description: 'Analyses de l\'utilisateur',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})