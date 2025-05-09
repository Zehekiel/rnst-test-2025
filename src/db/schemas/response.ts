import { z } from 'zod';

export const initSQlResponseSchema = z.object({
    success: z.boolean(),
    data: z.string().describe("Message de confirmation d'initialisation de la base de données"),
});

export const deleteSQlResponseSchema = z.object({
    success: z.boolean(),
    data: z.string().describe("Message de confirmation de suppression de la base de données"),
});

export const getAllProjectResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(
        z.object({
            id: z.string().describe("ID du projet"),
            name: z.string().describe("Nom du projet"),
            owner_id: z.string().describe("ID du propriétaire du projet"),
        }).describe("Objets contenant les informations sur les projets"),
    ).describe("Liste des projets"),
});

export const getAllAnalysisResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(
        z.object({
            id: z.string().describe("ID du projet"),
            name: z.string().describe("Nom du projet"),
            project_id: z.string().describe("ID du projet"),
            owner_id: z.string().describe("ID du propriétaire du projet"),
        }).describe("Objets contenant les informations sur les analyses"),
    ).describe("Tableau d'objets contenant les informations sur les analyses"),
});
