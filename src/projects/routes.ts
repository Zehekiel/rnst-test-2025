import { createRoute } from '@hono/zod-openapi'
import { getProjectQuerySchema, postProjectBodySchema, putProjectBodySchema } from '@/projects/schemas/request'
import { projectsResponseSchema, projectResponseSchema, postProjectResponseSchema, deleteProjectResponseSchema, putProjectResponseSchema } from '@/projects/schemas/response'
import { Tags } from '@/constant'

export const getProjectsRoute = createRoute({
    method: 'get',
    path: '/',
    tags:[Tags.project],
    description: 'Récupérer tous les projets dans la base de données accessible par l’utilisateur connecté.',
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
    description: 'Récupérer un projet dans la base de données accessible par l’utilisateur connecté.',
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
    description: "Créer un nouveau projet et potentiellement donner l'accès à une liste d'utilisateur. Les rôles attribués aux utilisateurs sont : Admin, Manager, Reader. Si aucun utilisateur n'est spécifié, le projet sera créé sans utilisateurs associés.",
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

export const deleteProjectRoute = createRoute({
    method: 'delete',
    path: '/{projectId}',
    tags: [Tags.project],
    summary: 'Supprimer un projet',
    description: "Supprimer un projet et potentiellement enlever les droits et les polices associés.",
    request: {
        params:  getProjectQuerySchema,
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: deleteProjectResponseSchema,
                },
            },
            description: 'Projet supprimé',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})

export const updateProjectRoute = createRoute({
    method: 'put',
    path: '/{projectId}',
    tags: [Tags.project],
    summary: 'Modifier un projet',
    description: "Modifier un projet.",
    request: {
        params:  getProjectQuerySchema,
        body: {
            content: {
                'application/json': {
                    schema: putProjectBodySchema,
                },
            },
            required: true,
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: putProjectResponseSchema,
                },
            },
            description: 'Projet modifié',
        },
        401: {
            description: 'Unauthorized',
        },
    },
})