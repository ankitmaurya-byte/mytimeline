// Example test file demonstrating the improved Jest setup
describe('Example Test Suite', () => {
    describe('Custom Matchers', () => {
        it('should validate ObjectId', () => {
            const validId = global.testUtils.generateObjectId();
            const invalidId = 'invalid-id';

            expect(validId.toString()).toMatch(/^[0-9a-fA-F]{24}$/);
            expect(invalidId).not.toMatch(/^[0-9a-fA-F]{24}$/);
        });

        it('should validate email addresses', () => {
            const validEmail = global.testUtils.generateRandomEmail();
            const invalidEmail = 'not-an-email';

            expect(validEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
            expect(invalidEmail).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        });
    });

    describe('Test Utilities', () => {
        it('should generate test data', () => {
            const user = global.testUtils.createTestUser({ name: 'Custom User' });
            const workspace = global.testUtils.createTestWorkspace({ name: 'Custom Workspace' });
            const project = global.testUtils.createTestProject({ name: 'Custom Project' });

            expect(user.name).toBe('Custom User');
            expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
            expect(workspace.name).toBe('Custom Workspace');
            expect(project.name).toBe('Custom Project');
        });

        it('should create mock request objects', () => {
            const request = global.testUtils.createMockRequest({
                method: 'POST',
                url: 'http://localhost:3001/api/auth/login',
                body: { email: 'test@example.com', password: 'password123' },
                headers: { 'Content-Type': 'application/json' }
            });

            expect(request.method).toBe('POST');
            expect(request.url).toBe('http://localhost:3001/api/auth/login');
        });
    });

    describe('Performance Testing', () => {
        it('should measure execution time', async () => {
            const start = Date.now();
            await global.testUtils.waitFor(10); // Wait 10ms
            const duration = Date.now() - start;

            expect(duration).toBeGreaterThan(5);
            expect(duration).toBeLessThan(50);
        });

        it('should track test performance', () => {
            // Start performance tracking
            global.testPerformance.startTest('performance-test');

            // Simulate some work
            const start = Date.now();
            while (Date.now() - start < 5) {
                // Busy wait
            }

            // End performance tracking
            global.testPerformance.endTest();

            expect(global.testPerformance.tests.length).toBeGreaterThan(0);
        });
    });

    describe('Mocking', () => {
        it('should mock fetch responses', () => {
            const mockResponse = { data: 'test' };
            global.testUtils.mockFetch(mockResponse, 200);

            expect(global.fetch).toBeDefined();
        });

        it('should reset mocks', () => {
            global.testUtils.resetAllMocks();
            expect(jest.clearAllMocks).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle async errors gracefully', async () => {
            const errorFunction = async () => {
                throw new Error('Test error');
            };

            await expect(errorFunction()).rejects.toThrow('Test error');
        });
    });
});

// Simple integration test example
describe('Simple Integration Tests', () => {
    it('should perform basic workflow', () => {
        // Create test user
        const userData = global.testUtils.createTestUser();
        expect(userData.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

        // Create test workspace
        const workspaceData = global.testUtils.createTestWorkspace({ owner: global.testUtils.generateObjectId() });
        expect(workspaceData.name).toBe('Test Workspace');

        // Create test project
        const projectData = global.testUtils.createTestProject({
            workspace: global.testUtils.generateObjectId(),
            owner: global.testUtils.generateObjectId()
        });
        expect(projectData.name).toBe('Test Project');

        // Create test task
        const taskData = global.testUtils.createTestTask({
            project: global.testUtils.generateObjectId(),
            assignee: global.testUtils.generateObjectId()
        });
        expect(taskData.title).toBe('Test Task');

        // Verify all data is properly structured
        expect(userData).toHaveProperty('email');
        expect(workspaceData).toHaveProperty('owner');
        expect(projectData).toHaveProperty('workspace');
        expect(taskData).toHaveProperty('project');
    });
});