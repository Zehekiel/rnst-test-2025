export const userTable = `
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
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
        UNIQUE (name)
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

export const projectPolicyTable = `
    CREATE TABLE project_policies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL CHECK (role_id IN ('1', '2', '3')),
        permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'update', 'write', 'delete')),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        UNIQUE (project_id, role_id, permission_level)
    )
`;

export const analysisPolicyTable = `
    CREATE TABLE analysis_policies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        analysis_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL CHECK (role_id IN ('1', '2', '3')),
        permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'update', 'write', 'delete')),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE,
        UNIQUE (analysis_id, role_id, permission_level)
    )
`;

export const rightsProjectTable = `
    CREATE TABLE rights_project (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        UNIQUE (user_id, role_id, project_id)
    )
`;

export const rightsAnalysisTable = `
    CREATE TABLE rights_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        analysis_id INTEGER NOT NULL,
        FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        UNIQUE (user_id, role_id, analysis_id)
    )
`;