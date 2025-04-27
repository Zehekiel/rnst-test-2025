import { z } from 'zod';


export const initSQlResponseSchema = z.object({
    success: z.boolean(),
    data: z.string().describe("Message de confirmation d'initialisation de la base de données"),
});

export const deleteSQlResponseSchema = z.object({
    success: z.boolean(),
    data: z.string().describe("Message de confirmation de suppression de la base de données"),
});

export const getUserDataResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        id: z.number().describe("ID de l'utilisateur"),
    }).describe("Message de confirmation d'initialisation de la base de données"),
});