import { z } from 'zod';


export const getUserDataResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        project_role: z.number().describe("ID de l'utilisateur"),
        analysis_role: z.string().describe("Nom de l'utilisateur"),
    }).describe("Message de confirmation d'initialisation de la base de données"),
});

export const getUserRoleResponseSchema = z.object({
    success: z.boolean(),
    data: z.string().describe("Rôle de l'utilisateur pour le projet ou l'analyse"),
});