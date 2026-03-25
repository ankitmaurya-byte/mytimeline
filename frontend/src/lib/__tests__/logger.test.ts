import { logInfo, logError, logWarn, logDebug } from '../logger'

// Mock console methods
const mockConsole = {
    group: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    groupEnd: jest.fn(),
}

beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()

    // Mock console methods
    global.console = {
        ...global.console,
        ...mockConsole,
    }
})

describe('Logger Functions', () => {
    describe('logInfo', () => {
        it('should log info message with data', () => {
            const message = 'Test info message'
            const data = { userId: 123, action: 'test' }

            logInfo(message, data)

            expect(mockConsole.group).toHaveBeenCalledWith(expect.stringContaining('INFO'))
            expect(mockConsole.log).toHaveBeenCalledWith('Message:', message)
            expect(mockConsole.log).toHaveBeenCalledWith('Data:', data)
            expect(mockConsole.groupEnd).toHaveBeenCalled()
        })

        it('should log info message without data', () => {
            const message = 'Test info message'

            logInfo(message)

            expect(mockConsole.group).toHaveBeenCalledWith(expect.stringContaining('INFO'))
            expect(mockConsole.log).toHaveBeenCalledWith('Message:', message)
            expect(mockConsole.groupEnd).toHaveBeenCalled()
        })
    })

    describe('logError', () => {
        it('should log error message with error data', () => {
            const message = 'Test error message'
            const error = new Error('Test error')

            logError(message, error)

            expect(mockConsole.group).toHaveBeenCalledWith(expect.stringContaining('ERROR'))
            expect(mockConsole.error).toHaveBeenCalledWith('Message:', message)
            expect(mockConsole.error).toHaveBeenCalledWith('Data:', error)
            expect(mockConsole.groupEnd).toHaveBeenCalled()
        })
    })

    describe('logWarn', () => {
        it('should log warning message with data', () => {
            const message = 'Test warning message'
            const data = { resource: 'memory', usage: '80%' }

            logWarn(message, data)

            expect(mockConsole.group).toHaveBeenCalledWith(expect.stringContaining('WARN'))
            expect(mockConsole.warn).toHaveBeenCalledWith('Message:', message)
            expect(mockConsole.warn).toHaveBeenCalledWith('Data:', data)
            expect(mockConsole.groupEnd).toHaveBeenCalled()
        })
    })

    describe('logDebug', () => {
        it('should log debug message with data', () => {
            const message = 'Test debug message'
            const data = { component: 'TestComponent', props: { id: 1 } }

            logDebug(message, data)

            expect(mockConsole.group).toHaveBeenCalledWith(expect.stringContaining('DEBUG'))
            expect(mockConsole.log).toHaveBeenCalledWith('Message:', message)
            expect(mockConsole.log).toHaveBeenCalledWith('Data:', data)
            expect(mockConsole.groupEnd).toHaveBeenCalled()
        })
    })

    describe('Timestamp formatting', () => {
        it('should include ISO timestamp in log groups', () => {
            const message = 'Test message'

            logInfo(message)

            expect(mockConsole.group).toHaveBeenCalledWith(
                expect.stringMatching(/ℹ️ INFO \[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
            )
        })
    })
})

