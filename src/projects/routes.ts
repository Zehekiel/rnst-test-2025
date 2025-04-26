import { createRoute } from '@hono/zod-openapi'
import { getProjectQuerySchema, postProjectBodySchema } from './schemas/request.js'
import { projectsResponseSchema, projectResponseSchema, postProjectResponseSchema } from './schemas/response.js'

const Tags = {
    project: 'Projects',
    analysis: 'Analyses',
} as const


export const getProjectsRoute = createRoute({
    method: 'get',
    path: '/',
    tags:[Tags.project],

    description: 'Récupérer tous les projets dans la base de données accessible par l’utilisateur connecté',
    summary: 'Récupérer tous les projets',
    responses: {
        200: {
        content: {
            'application/json': {
            schema: projectsResponseSchema,
            },
        },
        description: 'Tous les projets trouvés',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})

export const getProjectRoute = createRoute({
    method: 'get',
    path: '/{projectId}',
    request: {
        params: getProjectQuerySchema,
    },
    description: 'Récupérer un projet dans la base de données accessible par l’utilisateur connecté. Pas besoin de passer le projet ID dans la requête. ',
    tags: [Tags.project],
    summary: 'Trouver un projet par ID',
    responses: {
        200: {
        content: {
            'application/json': {
            schema: projectResponseSchema,
            },
        },
        description: 'Projet trouvé',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})

export const postProjectRoute = createRoute({
    method: 'post',
    path: '/',
    tags: [Tags.project],
    summary: 'Créer un nouveau projet',
    description: "Créer un nouveau projet et potentiellement donner l'accès à une liste d'utilisateur",
    request: {
        body: {
            content: {
                'application/json': {
                schema: postProjectBodySchema, 
                },
            },
            required: true,
        },
    },
    responses: {
        200: {
        content: {
            'application/json': {
            schema: postProjectResponseSchema,
            },
        },
        description: 'Projet créé',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})