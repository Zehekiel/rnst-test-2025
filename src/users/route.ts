import { createRoute } from '@hono/zod-openapi'
import { Tags } from '@/constant'
import { getUserDataResponseSchema, getUserRoleResponseSchema } from './schemas/response'
import { getUserRoleParamSchema } from './schemas/request'


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