import { z } from 'zod';

export const getProjectQuerySchema = z.object({
    projectId: z.string()
        .min(1)
        .describe('ID du projet')
});

export const postProjectBodySchema = z.object({
    project: z.object({
        name: z.string().describe('Nom du projet'),
    }),
    users: z.array(
        z.object({
            name: z.string().describe('Nom de l\'utilisateur'),
            role: z.enum(["Admin", "Manager", "Reader"]).describe('Rôle de l\'utilisateur dans le projet'),
        })
    )
        .optional()
        .describe('Tableau d\'utilisateurs à ajouter au projet'),
});

export const putProjectBodySchema = z.object({
    project: z.object({
        name: z.string().describe('Nom du projet'),
    }),
});