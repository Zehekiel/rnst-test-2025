import { createRoute } from '@hono/zod-openapi'
import { Tags } from '@/constant'
import { analysesResponseSchema, analysisResponseSchema, deleteAnalysisResponseSchema, postAnalysisResponseSchema, updateAnalysisResponseSchema } from '@/analyses/schemas/response'
import { getAnalysesQuerySchema, getAnalysisQuerySchema, postAnalysisBodySchema, updateAnalysisBodySchema } from '@/analyses/schemas/request'


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

export const deleteAnalysisRoute = createRoute({
    method: 'delete',
    path: 'projects/{projectId}/analyses/{analysisId}',
    tags:[Tags.analysis],
    description: "Supprimer une analyse d'un projet dans la base de données accessible par l’utilisateur connecté ainsi que les droits associés",
    summary: 'Supprimer une analyse',
    request: {
        params: getAnalysisQuerySchema,
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: deleteAnalysisResponseSchema,
                },
            },
            description: "Suppression d'une analyse",
        },
        401: {
            description: 'Unauthorized',
        },
    },
})

export const updateAnalysisRoute = createRoute({
    method: 'put',
    path: 'projects/{projectId}/analyses/{analysisId}',
    tags:[Tags.analysis],
    description: "Mettre à jour le nom d'une analyse d'un projet dans la base de données accessible par l’utilisateur connecté",
    summary: 'Mettre à jour le nom d\'une analyse',
    request: {
        params: getAnalysisQuerySchema, 
        body: {
            content: {
                'application/json': {
                    schema: updateAnalysisBodySchema,
                },
            },
            required: true,
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: updateAnalysisResponseSchema,
                },
            },
            description: 'Analyse mise à jour',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})