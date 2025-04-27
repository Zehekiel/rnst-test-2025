export const userTable = `
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_id INTEGER NOT NULL,
        FOREIGN KEY (role_id) REFERENCES roles(id)
    )
`;


export const roleTable = `
    CREATE TABLE roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL -- e.g., 'Admin', 'Manager', 'Reader'
    )
`;

export const projectTable = `
    CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        owner_id INTEGER NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES users(id) -- Qui a créé le projet (propriétaire)
    )
`;

export const analysisTable = `
    CREATE TABLE analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        project_id INTEGER NOT NULL,
        owner_id INTEGER NOT NULL, -- Qui a créé l'analyse (propriétaire de l'analyse)
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (owner_id) REFERENCES users(id)
    )
`;

export const projectPermissionsTable = `
    CREATE TABLE project_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        permission_level TEXT NOT NULL CHECK (permission_level IN ('read')), -- Pour l'instant, seulement 'read'
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (project_id, user_id) -- Un utilisateur n'a qu'une seule permission explicite par projet
    )
`;

export const analysisPermissionsTable = `
    CREATE TABLE analysis_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        analysis_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        permission_level TEXT NOT NULL CHECK (permission_level IN ('read')), -- Pour l'instant, seulement 'read'
        FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (analysis_id, user_id) -- Un utilisateur n'a qu'une seule permission explicite par analyse
    )
`;