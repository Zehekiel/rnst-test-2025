import { z } from 'zod';


export const getUserDataResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        id: z.number().describe("ID de l'utilisateur"),
        name: z.string().describe("Nom de l'utilisateur"),
    }).describe("Données de l'utilisateur"),
});

export const getUserRoleResponseSchema = z.object({
    success: z.boolean(),
    data: z.string().describe("Rôle de l'utilisateur pour le projet ou l'analyse"),
});

export const getUserAuthorizationResponseSchema = z.object({
    success: z.boolean(),
    data: z.boolean().describe("Autorisation de l'utilisateur pour l'action demandée"),
});

export const getUserProjectResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(z.object({
        id: z.number().describe("ID du projet"),
        name: z.string().describe("Nom du projet"),
        owner_id: z.number().describe("ID de l'utilisateur propriétaire du projet"),
    })).describe("Tableau de projets de l'utilisateur"),
});

export const getUserAnalyseResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(z.object({
        id: z.number().describe("ID de l'analyse"),
        name: z.string().describe("Nom de l'analyse"),
        project_id: z.number().describe("ID du projet associé à l'analyse"),
        owner_id: z.number().describe("ID de l'utilisateur propriétaire de l'analyse"),
    })).describe("Tableau d'analyses de l'utilisateur"),
});