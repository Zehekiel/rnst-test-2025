export const Tags = {
    project: 'Projects',
    analysis: 'Analyses',
    connection: 'Connexion',
    database: 'Base de données',
    users: 'Utilisateurs'
} as const

export const cookieName = 'rnest_user'

export const secret = process.env.GITHUB_SECRET ?? 'GITHUB_SECRET is not defined'

export const roles = {"administrateur": 'Admin', "Manager": 'Manager', "Reader": 'Reader'}

export const actions = {
    read: 'read',
    write: 'write',
    update: 'update',
    delete: 'delete'
} as const