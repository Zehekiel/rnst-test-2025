// Suppose que vous récupérez ces données de la base de données
export interface User {
    id: number;
    name: string;
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

export type Action =
    'project:create' | 'project:read' | 'project:update' | 'project:delete' |
    'analysis:create' | 'analysis:read' | 'analysis:update' | 'analysis:delete';

export type Resource = Project | Analysis | null;

export type PermissionLevel = 'read' | 'update' | 'write' | 'delete';

export type Role = {
    id: number;
    name: string;
};

export type UserRole = {
    role_name: string;
}