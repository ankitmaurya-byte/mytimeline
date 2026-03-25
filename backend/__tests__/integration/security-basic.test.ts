// Basic security tests
describe('Basic Security Tests', () => {
    it('should have test environment configured', () => {
        expect(process.env.NODE_ENV).toBe('test');
    });

    it('should have JWT secret configured', () => {
        expect(process.env.JWT_SECRET).toBeDefined();
        expect(process.env.JWT_SECRET?.length).toBeGreaterThan(10);
    });

    it('should have MongoDB URI configured', () => {
        expect(process.env.MONGO_URI).toBeDefined();
    });
});




