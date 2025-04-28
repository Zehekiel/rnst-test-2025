import { z } from 'zod';

export const getUserRoleParamSchema = z.object({
    projectId: z.string()
        .nullable()
        .default(null) 
        .describe('ID du projet dont on veut obtenir le rôle'),
    analysisId: z.string()
        .optional()
        .nullable()
        .default(null)
        .describe('ID de l\'analyse dont on veut obtenir le rôle'),
    userId: z.string().describe('ID de l\'utilisateur')
});

export const getUserAuthorizationParamSchema = z.object({
    projectId: z.string()
        .optional()
        .nullable()
        .default(null) 
        .describe('ID du projet dont on veut obtenir le rôle'),
    analysisId: z.string()
        .optional()
        .nullable()
        .default(null) 
        .describe('ID de l\'analyse dont on veut obtenir le rôle'),
    userId: z.string().describe('ID de l\'utilisateur'),
    action: z.enum(["read", "write", "delete", "update"]).describe('Type d\'action à vérifier')
});

export const getUserProjectParamSchema = z.object({
    userId: z.string()
        .describe('ID de l\'utilisateur dont on veut obtenir les projets'),
})

export const getUserAnalyseParamSchema = z.object({
    userId: z.string()
        .describe('ID de l\'utilisateur dont on veut obtenir les analyses'),
    projectId: z.string()
        .describe('ID du projet dont on veut obtenir les analyses'),
})