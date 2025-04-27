import { z } from 'zod';


export const getUserDataResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        id: z.number().describe("ID de l'utilisateur"),
        name: z.string().describe("Nom de l'utilisateur"),
    }).describe("Message de confirmation d'initialisation de la base de données"),
});

export const getUserRoleResponseSchema = z.object({
    success: z.boolean(),
    data: z.string().describe("Rôle de l'utilisateur pour le projet ou l'analyse"),
});

export const getUserAuthorizationResponseSchema = z.object({
    success: z.boolean(),
    data: z.boolean().describe("Autorisation de l'utilisateur pour l'action demandée"),
});