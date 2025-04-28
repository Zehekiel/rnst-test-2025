import { z } from 'zod';

export const getAnalysesQuerySchema = z.object({
    projectId: z.string()
        .min(1)
        .describe('ID du projet')
});

export const postAnalysisBodySchema = z.object({
    analysisName: z.string()
        .min(1)
        .describe('Nom de l\'analyse'),
    users: z.array(
        z.object({
            name: z.string().describe('Nom de l\'utilisateur'),
            role: z.enum(["Admin", "Manager", "Reader"]).describe('Rôle de l\'utilisateur dans le projet et l\'analyse'),
        })
    )
        .optional()
        .describe('Tableau d\'utilisateurs à ajouter au projet'),
    });

    export const getAnalysisQuerySchema = z.object({
        projectId: z.string()
            .min(1)
            .describe('ID du projet'),
        analysisId: z.string()
            .min(1)
            .describe('ID de l\'analyse')
    });

export const updateAnalysisBodySchema = z.object({
    analysis: z.object({
        name: z.string()
            .min(1)
            .describe('Nom de l\'analyse'),
    })
});

export const deleteAnalysisQuerySchema = z.object({
    projectId: z.string()
        .min(1)
        .describe('ID du projet'),
    analysisId: z.string()
        .min(1)
        .describe('ID de l\'analyse')
});
