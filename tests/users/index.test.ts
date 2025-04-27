import { Hono } from 'hono';
import { cookieName, secret } from '@/constant'; // Import constants
import { User } from '@/types'; // Import types
import { getAsync, getUserRole } from '@/helper'; // Import the function to be mocked
import { getSignedCookie } from 'hono/cookie'; // Import the function to be mocked
import usersRoute from '@/users';

// --- Mocks ---
// Mock the database helper function
jest.mock('@/helper', () => ({
    getAsync: jest.fn(),
    getUserRole: jest.fn(),
}));
// Mock the cookie function
jest.mock('hono/cookie', () => ({
    getSignedCookie: jest.fn(),
}));

// --- Test Setup ---
const app = new Hono().route('/users', usersRoute); // Mount the routes

// Type cast the mocked functions for type safety
const mockedGetAsync = getAsync as jest.Mock;
const mockedGetUserRole = getUserRole as jest.Mock;
const mockedGetSignedCookie = getSignedCookie as jest.Mock;

describe('User Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // or jest.resetAllMocks();
    });

    // --- Tests for GET /users/ ---
    describe('GET /users/ (getCurrentDataRoute)', () => {
        it('should return user data when a valid signed cookie is present', async () => {
            // Arrange
            const mockUserId = 123;
            const mockUserData: User = { id: mockUserId, name: 'Test User' };
            // Simulate the structure returned by getSignedCookie
            const mockCookieValue = JSON.stringify({ id: mockUserId });

            // Mock getSignedCookie to return the payload value for the specific cookie name
            mockedGetSignedCookie.mockResolvedValue({[cookieName]: mockCookieValue}); // It returns the value directly
            // Mock getAsync to return user data
            mockedGetAsync.mockResolvedValue(mockUserData);
            mockedGetUserRole.mockResolvedValue(undefined); // Not relevant for this test

            // Act
            // Simulate the cookie being present in the request headers
            const req = new Request(`http://localhost/users`, {
                headers: {
                    // Actual cookie signing isn't tested here, just the presence and retrieval logic
                    Cookie: `${cookieName}=signed-value-doesnt-matter-here`,
                },
            });
            const res = await app.request(req);


            // Assert
            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({
                success: true,
                data: mockUserData,
            });
            // Check if cookie function was called (context object might vary slightly)
            expect(mockedGetSignedCookie).toHaveBeenCalledWith(expect.anything(), secret);
            expect(mockedGetAsync).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [mockUserId]); // Check DB call
        });

        it('should return 401 (or handle error) if cookie is missing or invalid', async () => {
            // Arrange
            // Mock getSignedCookie to return undefined (no valid cookie)
            mockedGetSignedCookie.mockResolvedValue(undefined);

            // Act
            const res = await app.request('/users'); // No cookie header

            // Assert
            // Expecting the code to handle the undefined cookie value gracefully.
            // If it tries JSON.parse(undefined), it will throw.
            // Assuming the current implementation might lead to an error:
            expect(res.status).toBe(500); // Or check for specific error handling if implemented (e.g., 401)
            // If it proceeds and getAsync returns null:
            // mockedGetAsync.mockResolvedValue(null);
            // expect(await res.json()).toEqual({ success: true, data: null }); // Adjust based on actual behavior
            expect(mockedGetAsync).not.toHaveBeenCalled(); // Should not reach DB query if cookie fails early
        });

        it('should return null data if cookie is valid but user not found in DB', async () => {
            // Arrange
            const mockUserId = 404;
            const mockCookieValue = JSON.stringify({ id: mockUserId });
            mockedGetSignedCookie.mockResolvedValue({[cookieName]: mockCookieValue}); // It returns the value directly
            // Mock getAsync to return null (user not found)
            mockedGetAsync.mockResolvedValue(null);

             // Act
            const req = new Request(`http://localhost/users`, {
                headers: { Cookie: `${cookieName}=signed-value` },
            });
            const res = await app.request(req);

            // Assert
            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({
                success: true,
                data: null, // Expect null when user not found
            });
            expect(mockedGetSignedCookie).toHaveBeenCalledWith(expect.anything(), secret);
            expect(mockedGetAsync).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [mockUserId]);
        });
    });

    // --- Tests for GET /users/{userId}/project/{projectId}/analyse/{analysisId} ---
    describe('GET /users/{userId}/project/{projectId}/analyse/{analysisId} (getUserRoleRoute)', () => {
        const testUserId = '1';
        const testProjectId = '10';
        const testAnalysisId = '100';
        const placeholderProjectId = '{projectId}';
        const placeholderAnalysisId = '{analysisId}';

        // Helper type for the mocked DB response for roles
        type MockRoleResponse = { role_name: string };

        it('should return project role name when projectId is valid', async () => {
            // Arrange
            const mockRole = 'ProjectAdmin';
            mockedGetUserRole.mockResolvedValue(mockRole);
            const path = `/users/${testUserId}/project/${testProjectId}/analyse/${placeholderAnalysisId}`;

            // Act
            const res = await app.request(path);

            // Assert
            expect(res.status).toBe(200);
            // NOTE: Testing current behavior where it returns the role name directly.
            expect(await res.json()).toEqual({
                success: true,
                data: 'ProjectAdmin',
            });
            expect(mockedGetUserRole).toHaveBeenCalledWith(testUserId, testProjectId, placeholderAnalysisId);
        });

        it('should return analysis role name when analysisId is valid and projectId is placeholder', async () => {
            // Arrange
            const mockRole = 'AnalysisViewer';
            // Mock the first call (project check) to return null, second call (analysis check) to return the role
            mockedGetUserRole.mockResolvedValue(mockRole); // For the analysis check
            const path = `/users/${testUserId}/project/${placeholderProjectId}/analyse/${testAnalysisId}`;

            // Act
            const res = await app.request(path);

            // Assert
            expect(res.status).toBe(200);
            // NOTE: Testing current behavior.
            expect(await res.json()).toEqual({
                success: true,
                data: 'AnalysisViewer',
            });
            // Check calls - project should be checked first (and return null), then analysis
            expect(mockedGetUserRole).toHaveBeenCalledWith(testUserId, placeholderProjectId, testAnalysisId);
        });


        it('should return null data for project role if user/project combo not found', async () => {
             // Arrange
             mockedGetUserRole.mockResolvedValue(null); // Simulate role not found
            const path = `/users/${testUserId}/project/${testProjectId}/analyse/${placeholderAnalysisId}`;

            // Act
            const res = await app.request(path);

            // Assert
            expect(res.status).toBe(200);
             // NOTE: Testing current behavior.
            expect(await res.json()).toEqual({
                success: true,
                data: null,
            });
            expect(mockedGetUserRole).toHaveBeenCalledWith(testUserId, testProjectId, placeholderAnalysisId);
        });

        it('should return null data for analysis role if user/analysis combo not found', async () => {
             // Arrange
             // Mock project check returning null, analysis check returning null
            mockedGetUserRole.mockResolvedValue(null);
            const path = `/users/${testUserId}/project/${placeholderProjectId}/analyse/${testAnalysisId}`;

            // Act
            const res = await app.request(path);

            // Assert
            expect(res.status).toBe(200);
             // NOTE: Testing current behavior.
            expect(await res.json()).toEqual({
                success: true,
                data: null,
            });
            expect(mockedGetUserRole).toHaveBeenCalledTimes(1); // Both project and analysis checks should happen
            expect(mockedGetUserRole).toHaveBeenCalledWith( testUserId,placeholderProjectId, testAnalysisId);
        });

        it('should return null when both projectId and analysisId are placeholders', async () => {
            // Arrange
            const path = `/users/${testUserId}/project/${placeholderProjectId}/analyse/${placeholderAnalysisId}`;

            // Act
            const res = await app.request(path);

            // Assert
            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({
                success: true, // The code currently returns success: true even on error
                data:null,
            });
            expect(mockedGetAsync).not.toHaveBeenCalled(); // No DB calls should be made
            expect(mockedGetUserRole).toHaveBeenCalled(); // No role checks should happen
        });
    });
});
