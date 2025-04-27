import { z } from 'zod';

export const getUserRoleParamSchema = z.object({
    projectId: z.string()
        .optional()
        .describe('ID du projet dont on veut obtenir le rôle'),
    analysisId: z.string()
        .optional()
        .describe('ID de l\'analyse dont on veut obtenir le rôle'),
    userId: z.string().describe('ID de l\'utilisateur')
});