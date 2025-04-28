// jest.setup.js (ou jest.setup.ts)

// Avant chaque test, créez un espion sur console.error
// et remplacez son implémentation par une fonction vide.
beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Après chaque test, restaurez l'implémentation originale de console.error
// C'est important pour éviter que les mocks n'affectent d'autres tests.
afterEach(() => {
    jest.restoreAllMocks();
});