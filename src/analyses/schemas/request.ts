import { z } from 'zod';

export const getAnalysesQuerySchema = z.object({
    projectId: z.string()
        .min(1)
        .describe('ID du projet')
});

export const getAnalysisQuerySchema = z.object({
    projectId: z.string()
        .min(1)
        .describe('ID du projet'),
    analysisId: z.string()
        .min(1)
        .describe('ID de l\'analyse')
});


export const postAnalysisBodySchema = z.object({
    analysisId: z.string()
        .min(1)
        .describe('ID de l\'analyse'),
    users: z.array(z.string()).optional().describe('ID des utilisateurs')
});
