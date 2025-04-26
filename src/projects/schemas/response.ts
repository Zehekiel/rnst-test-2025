import { z } from 'zod';


export const projectResponseSchema = z.object({
    success: z.boolean(),
    data: z.string().describe("ID d'un projet"),
});

export const projectsResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(
        z.string().describe("ID d'un projet"),
    ). describe("Liste des ID de projet"),
});

export const postProjectResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        project: z.string().describe("Message de confirmation d'ajout de projet"),
        users: z.string().optional().describe("Message de confirmation d'ajout d'utilisateur"),
    }),
});