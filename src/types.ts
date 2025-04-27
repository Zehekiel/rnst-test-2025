// Suppose que vous récupérez ces données de la base de données
export interface User {
    id: number;
    username: string;
    role_id: number;
    role_name: 'Admin' | 'Manager' | 'Reader'; // Inclure le nom du rôle pour faciliter les vérifications
}

export interface Project {
    id: number;
    name: string;
    owner_id: number;
}

export interface Analysis {
    id: number;
    name: string;
    project_id: number;
    owner_id: number;
}

// Actions possibles
export type Action =
    'project:create' | 'project:read' |
    'analysis:create' | 'analysis:read';

// Ressource possible (peut être null pour les actions de création globale)
export type Resource = Project | Analysis | null;