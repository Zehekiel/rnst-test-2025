# Documentation

## Instructions pour lancer l'application et les tests

1. **Installation des dépendances** :

- Assurez-vous d'avoir installé [Node.js](https://nodejs.org/) (version v20.14.0 ou supérieure).
- Exécutez la commande `npm install` pour installer toutes les dépendances nécessaires.

2. **Lancer l'application** :

- Utilisez la commande `npm run dev` pour démarrer l'application en mode développement.
- L'application sera accessible à l'adresse `http://localhost:3000/ui`.
- La documentation des API est disponible à l'adresse `http://localhost:3000/doc`.

3. **Configuration de l'environnement** :

- Créez un fichier `.env` à la racine du projet et ajoutez les variables d'environnement nécessaires.
  Voici un exemple de contenu pour le fichier `.env` :
  Vous trouverez les valeurs dans [github] (https://github.com/Zehekiel/rnst-test-2025/settings/environments/6493135193/edit).

```bash
  GITHUB_SECRET= secret_github
  GITHUB_ID=  id_github
  GITHUB_REDIRECT_URI= redirect_uri_github
```

- Dans `http://localhost:3000/ui`, vous devez vous connecter avec votre compte GitHub. Pour cela, cliquer sur le bouton "connection à github" en haut à droite dans le header violet et vous serez redirigé vers la page de connexion de GitHub. Une fois que vous êtes connecté, vous serez redirigé vers l'interface utilisateur de l'application.

4. **Base de données** :

- L'application utilise SQLite pour le stockage des données. La base de données doit être initialisée manuellement.
- Pour initialiser la base de données, dans l'ui, allez dans la section "Base de données" et Lancez l'appel "/database/init".
  Cela va créer les tables nécessaires dans la base de données SQLite.
  Ainsi que vous créez en tant qu'administrateur et d'autres utilisateurs.
  3 projets et analyses seront créés automatiquement.
- Vous pouvez également effacer les tables de la base de données en lançant l'appel "/database/delete" dans l'ui.

5. **Exécuter les tests** :

- Pour lancer les tests unitaires, utilisez la commande `npm run test`.

## Fonctionnalités de l'application

- **Authentification** : L'application utilise l'authentification OAuth de GitHub pour permettre aux utilisateurs de se connecter.
- **Gestion des utilisateurs** : Les utilisateurs peuvent se connecter et se déconnecter de l'application. Ils peuvent également voir leurs informations de profil.
- **Gestion des projets** : Les utilisateurs peuvent créer, lire, mettre à jour et supprimer des projets. Ils peuvent également voir la liste de tous les projets.
- **Gestion des analyses** : Les utilisateurs peuvent créer, lire, mettre à jour et supprimer des analyses. Ils peuvent également voir la liste de toutes les analyses.
- **Gestion de la base de données** : L'application permet d'initialiser et de supprimer la base de données SQLite. Elle permet également de voir les informations sur la base de données.
- **Gestion des sessions** : L'application utilise des cookies pour gérer les sessions des utilisateurs.

## Choix techniques et architecturaux

- **Framework** : L'application utilise [Hono](https://hono.dev//) pour la gestion des routes et des middlewares comme demandé.
- **Language** : TypeScript est utilisé pour le développement de l'application comme demandé.
- **Gestion des requêtes** : Utilisation de [zod](https://zod.dev/) pour la validation des données d'entrée et de sortie des requêtes car il est léger, facile à utiliser et inclus dans le framework Hono.
- **Base de données** : [node-sqlite3](https://github.com/TryGhost/node-sqlite3/wiki/API) est utilisée pour le stockage des données sans ORM. Comme demandé, SQLite est utilisé pour le stockage des données. Il est léger et facile à utiliser pour les petites applications.
- **Tests** : Les tests sont réalisés avec [Jest](https://jestjs.io/) et [Supertest](https://www.npmjs.com/package/supertest). Jest est adapté dans les environnements Node.js et permet de réaliser des tests unitaires et d'intégration.
- **Documentation** : La documentation de l'API est générée avec [Swagger](https://swagger.io/) et est accessible via l'interface utilisateur.
  La documentation est générée automatiquement à partir des schémas de validation des requêtes et des réponses. Cela permet de garder la documentation à jour avec le code. l'interface est accessible à l'adresse `http://localhost:3000/doc` pour la documentation des API et à l'adresse `http://localhost:3000/ui` pour l'interface utilisateur.
- **Validation des données** : Utilisation de [@hono/zod-openapi](https://hono.dev/examples/zod-openapi) pour la validation des données d'entrée et de sortie.
  Cela permet de valider les données d'entrée et de sortie des requêtes et de générer la documentation Swagger automatiquement. Facilite la validation des données et la génération de la documentation Swagger. Inclus dans le framework Hono.
- **Gestion des environnements** : Utilisation de [dotenv](https://www.npmjs.com/package/dotenv) pour charger les variables d'environnement depuis le fichier `.env`.
  Cela permet de garder les informations sensibles (comme les clés d'API) hors du code source et de faciliter la configuration de l'application en fonction de l'environnement (développement, production, etc.).
- **Gestion des sessions** : Utilisation de ['hono/cookie'](https://hono.dev/docs/helpers/cookie#setcookie-setsignedcookie) pour la gestion des sessions.
  Cela permet de gérer les sessions des utilisateurs de manière sécurisée et de stocker les informations de session dans des cookies signés.
  Cela permet de garder les informations de session sécurisées et de faciliter la gestion des sessions des utilisateurs. Il est utilisé pour stocker les informations de session dans des cookies signés après la connexion de l'utilisateur à l'oauth de GitHub.
- **Lint** : Utilisation de [ESLint](https://eslint.org/) pour le linting du code.
- **Formatage** : Utilisation de [Prettier](https://prettier.io/) pour le formatage du code.
- **Authentification** : Utilisation de [GitHub OAuth](https://docs.github.com/en/developers/apps/building-oauth-apps/authorization-options-for-oauth-apps) pour l'authentification des utilisateurs.
  Cela permet aux utilisateurs de se connecter avec leur compte GitHub et d'accéder à l'application. L'application utilise le flux d'autorisation OAuth 2.0 pour obtenir un jeton d'accès et accéder aux informations de l'utilisateur. Comme vous avez un compte GitHub, vous pouvez vous connecter à l'application avec votre compte GitHub sans avoir à créer un compte séparé.

- **Structure du projet** :
  Pour chaque dossier dans "/src", il est inclus :

    - un dossier schema qui contient les schémas de requête et de réponse pour chaque route.
    - un fichier route.ts qui contient les routes pour chaque API.
    - un fichier helper.ts qui contient des fonctions utilitaires.
    - un fichier index.ts qui contient la logique métier pour chaque route.

    Voici la structure du projet dans le dossier `/src` :

    - `analyses/` : Contient les routes de l'API lié à la connexion avec github aux analyses ainsi que les schémas de réponse et de requête.
    - `connection/` : Contient les routes de l'API lié à la connexion avec github.
    - `db/` : Contient les routes de l'API lié à la base de données ainsi que les schémas de réponse et de requête.
    - `middleware/` : Contient les middlewares de l'application.
    - `projects/` : Contient les routes de l'API lié aux projets ainsi que les schémas de réponse et de requête.
    - `users/` : Contient les routes de l'API lié aux utilisateurs ainsi que les schémas de réponse et de requête.
    - `constant.ts` : Contient des constantes utilisées dans l'application.
    - `database.ts` : Fichier de configuration de la base de données SQLite.
    - `helper.ts` : Contient des fonctions utilitaires.
    - `index.ts` : Point d'entrée de l'application.
    - `type.ts` : Contient les types utilisés dans l'application.

    Un dossier `tests` qui contient les tests unitaires de l'application est également inclus à la racine du projet.
    et respecte la même structure que le dossier `/src`.

    Cette structure permet de séparer les différentes parties de l'application par thème qui sont représentées dans l'ui et aussi de faciliter la maintenance du code en gardant une structure claire et cohérente.

- **Sécurité** : Utilisation de middlewares qui vérifie la présence de cookie pour la validation des données d'entrée et de sortie.

- **CI** : Utilisation de GitHub Actions pour l'intégration continue et le déploiement automatique.
    - Le fichier `.github/workflows/ci.yml` contient la configuration pour vérifier que le projet puisse se construire et respecte le lint.

## Gestion des droits d'accès

L'application utilise un système de gestion des droits d'accès basé sur les rôles des utilisateurs. Voici les rôles disponibles :

- **Administrateur** : Dispose de tous les droits. Peut créer, lire, mettre à jour et supprimer tous les projets et analyses. Peut également gérer les utilisateurs et leurs rôles.
- **Utilisateur** : Peut créer, lire, mettre à jour et supprimer uniquement ses propres projets et analyses. Ne peut pas gérer les utilisateurs ni leurs rôles.
- **Lecteur (Reader)** : Peut uniquement lire les projets et analyses publics. Ne peut pas créer, mettre à jour ou supprimer des projets et analyses. Ne peut pas gérer les utilisateurs.

### Fonctionnement des droits d'accès

Les droits d'accès sont gérés au niveau de l'application et sont basés sur les rôles attribués aux utilisateurs. Chaque utilisateur se voit attribuer un rôle qui détermine ses permissions. Ces rôles sont définis et stockés dans la base de données. Lorsqu'un utilisateur tente d'accéder à une ressource ou d'exécuter une action, l'application vérifie ses droits d'accès en fonction de son rôle. Si l'utilisateur n'a pas les permissions nécessaires, une erreur est renvoyée.

### Tables de la base de données

Les tables suivantes sont créées automatiquement lors de l'initialisation de la base de données pour gérer les utilisateurs, les projets, les analyses et leurs droits d'accès :

- **`users`** : Contient les informations sur les utilisateurs (id, nom, email, mot de passe, rôle).
- **`roles`** : Contient les informations sur les rôles (id, nom, description).
- **`projects`** : Contient les informations sur les projets (id, nom, description, date de création, date de mise à jour, propriétaire, visibilité).
- **`analyses`** : Contient les informations sur les analyses (id, nom, description, date de création, date de mise à jour, propriétaire, visibilité).
- **`project_policies`** : Définit les politiques d'accès aux projets en fonction des rôles des utilisateurs (id, nom, description, droits associés).
- **`analysis_policies`** : Définit les politiques d'accès aux analyses en fonction des rôles des utilisateurs (id, nom, description, droits associés).
- **`rights_project`** : Associe les politiques d'accès aux projets à des utilisateurs spécifiques (id, utilisateur, projet, politique associée).
- **`rights_analysis`** : Associe les politiques d'accès aux analyses à des utilisateurs spécifiques (id, utilisateur, analyse, politique associée).

### Politiques par défaut

Lors de l'initialisation de la base de données, une politique de projet par défaut est créée avec un niveau d'accès minimal (valeur 0). Cette politique permet aux administrateurs et aux managers de créer des projets et d'y accéder. Elle est automatiquement associée à l'utilisateur qui crée un projet, ainsi qu'aux futurs managers qui en auront besoin. Cela garantit une gestion flexible et évolutive des droits d'accès.

### Politiques de projet et d'analyse

Les politiques de projet et d'analyse définissent les règles d'accès aux projets et analyses. Elles sont créées automatiquement lors de l'initialisation de la base de données et ajoutées à chaque création de projet ou d'analyse. Ces politiques permettent une gestion flexible et évolutive des permissions.

Chaque rôle d'utilisateur dispose de droits spécifiques associés aux projets et analyses. Pour gérer ces droits, deux tables ont été créées dans la base de données : `project_policies` et `analysis_policies`. Ces tables centralisent les informations sur les politiques d'accès pour chaque rôle.

En résumé, les politiques de projet et d'analyse servent à :

- Initialiser les droits d'accès lors de la création d'un projet ou d'une analyse.
- Définir des règles d'accès adaptées aux rôles des utilisateurs.
- Assurer une gestion cohérente et évolutive des permissions.

Cette structure garantit que les droits d'accès sont configurés de manière claire et centralisée, tout en restant flexibles pour répondre aux besoins spécifiques des utilisateurs.

### Droits de projet et d'analyse

Les droits de projet et d'analyse permettent de gérer les permissions d'accès des utilisateurs aux projets et analyses. Ces droits sont initialisés automatiquement lors de la création d'un projet ou d'une analyse et sont associés aux utilisateurs concernés.

Chaque utilisateur dispose de droits spécifiques définis dans les tables `rights_project` et `rights_analysis`. Ces tables centralisent les informations sur les permissions d'accès pour chaque utilisateur. Elles sont liées respectivement aux tables `project_policies` et `analysis_policies`, qui définissent les politiques d'accès applicables.

Cette structure assure une gestion centralisée et cohérente des permissions, tout en offrant une flexibilité pour adapter les droits d'accès en fonction des besoins des utilisateurs et des rôles définis dans la base de données.

## Améliorations possibles

- **Gestion des erreurs** : Améliorer la gestion des erreurs pour fournir des messages d'erreur plus détaillés et utiles. Ainsi qu'utiliser une bibliothèque de gestion des erreurs pour centraliser la gestion des erreurs dans l'application.
- **Internationalisation** : Ajouter la prise en charge de plusieurs langues pour l'interface utilisateur et les messages d'erreur.
- **Accessibilité** : Améliorer l'accessibilité de l'interface utilisateur pour les utilisateurs ayant des besoins spécifiques.
- **Tests** : Ajouter des tests unitaires et d'intégration pour couvrir tous les cas d'utilisation de l'application.
- **Sécurité** : Ajouter des mesures de sécurité supplémentaires, comme la protection contre les attaques CSRF et XSS.
- **Optimisation des performances** : Optimiser les requêtes SQL pour améliorer les performances de l'application.
- **Gestion des utilisateurs** : Ajouter la possibilité de gérer les utilisateurs (ajouter, supprimer, modifier) depuis l'interface utilisateur.
- **Gestion des rôles** : Ajouter la possibilité de gérer les rôles des utilisateurs depuis l'interface utilisateur.
- **Gestion des droits d'accès** : Utiliser un middleware pour gérer les droits d'accès aux routes de l'API.
