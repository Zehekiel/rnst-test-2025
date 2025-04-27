import { z } from 'zod';


export const initSQlResponseSchema = z.object({
    success: z.boolean(),
    data: z.string().describe("Message de confirmation d'initialisation de la base de données"),
});

export const deleteSQlResponseSchema = z.object({
    success: z.boolean(),
    data: z.string().describe("Message de confirmation de suppression de la base de données"),
});