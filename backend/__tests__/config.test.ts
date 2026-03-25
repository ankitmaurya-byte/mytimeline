// Simple test to verify Jest configuration is working
describe('Jest Configuration Test', () => {
    it('should run basic test', () => {
        expect(1 + 1).toBe(2);
    });

    it('should have access to test utilities', () => {
        expect(global.testUtils).toBeDefined();
        expect(global.testUtils.generateObjectId).toBeDefined();
        expect(global.testUtils.createTestUser).toBeDefined();
    });

    it('should have custom matchers', () => {
        const objectId = global.testUtils.generateObjectId();
        expect(objectId.toString()).toMatch(/^[0-9a-fA-F]{24}$/);
    });

    it('should handle async operations', async () => {
        const result = await Promise.resolve('test');
        expect(result).toBe('test');
    });

    it('should have environment variables set', () => {
        expect(process.env.NODE_ENV).toBe('test');
        expect(process.env.JWT_SECRET).toBeDefined();
    });
});




