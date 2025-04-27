export const Tags = {
    project: 'Projects',
    analysis: 'Analyses',
    connection: 'Connexion',
    database: 'Base de données',
} as const

export const cookieName = 'rnest_user'

export const secret = process.env.GITHUB_SECRET ?? 'GITHUB_SECRET is not defined'

export const roles = {"administrateur": 'Admin', "Manager": 'Man', "Reader": 'Reader'}