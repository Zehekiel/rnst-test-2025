export const Tags = {
    project: 'Projects',
    analysis: 'Analyses',
    connection: 'Connexion',
} as const

export const cookieName = 'rnest_user'

export const secret = process.env.GITHUB_SECRET ?? 'GITHUB_SECRET is not defined'