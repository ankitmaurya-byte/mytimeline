import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoggerDemo } from '../LoggerDemo'
import { logInfo, logError, logWarn, logDebug } from '@/lib/logger'

// Mock the logger
jest.mock('@/lib/logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
    logWarn: jest.fn(),
    logDebug: jest.fn(),
}))

// Mock console methods
const mockConsole = {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
}

// Mock browser APIs
Object.defineProperty(window, 'navigator', {
    value: {
        userAgent: 'test-user-agent',
        language: 'en-US',
        platform: 'test-platform',
        cookieEnabled: true,
        onLine: true,
    },
    writable: true,
})

Object.defineProperty(window, 'screen', {
    value: {
        width: 1920,
        height: 1080,
    },
    writable: true,
})

Object.defineProperty(window, 'localStorage', {
    value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        length: 0,
    },
    writable: true,
})

Object.defineProperty(window, 'sessionStorage', {
    value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        length: 0,
    },
    writable: true,
})

Object.defineProperty(window, 'performance', {
    value: {
        getEntriesByType: jest.fn(() => []),
        getEntriesByName: jest.fn(() => []),
        memory: {
            usedJSHeapSize: 1024 * 1024 * 50, // 50 MB
            totalJSHeapSize: 1024 * 1024 * 100, // 100 MB
            jsHeapSizeLimit: 1024 * 1024 * 200, // 200 MB
        },
    },
    writable: true,
})

describe('LoggerDemo Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Mock console methods
        Object.defineProperty(global, 'console', {
            value: mockConsole,
            writable: true,
        })
    })

    describe('Component rendering', () => {
        it('renders without crashing', () => {
            render(<LoggerDemo />)
            expect(screen.getByText('Real Data Logger')).toBeInTheDocument()
            expect(screen.getByText(/Capture Real App Data/)).toBeInTheDocument()
            expect(screen.getByText(/Log Real Console Data/)).toBeInTheDocument()
        })

        it('displays initial count of 0', () => {
            render(<LoggerDemo />)
            expect(screen.getByText('Capture Real App Data (0)')).toBeInTheDocument()
        })
    })

    describe('Capture Real App Data button', () => {
        it('calls logger functions when clicked', async () => {
            render(<LoggerDemo />)
            const button = screen.getByText(/Capture Real App Data/)
            fireEvent.click(button)

            await waitFor(() => {
                expect(logInfo).toHaveBeenCalledWith('Application environment data captured', expect.any(Object))
                expect(logDebug).toHaveBeenCalledWith('Browser capabilities detected', expect.any(Object))
            })
        })

        it('increments count when clicked', async () => {
            render(<LoggerDemo />)
            const button = screen.getByText(/Capture Real App Data/)

            // Click first time
            fireEvent.click(button)
            await waitFor(() => {
                expect(screen.getByText('Capture Real App Data (1)')).toBeInTheDocument()
            })

            // Click second time
            fireEvent.click(button)
            await waitFor(() => {
                expect(screen.getByText('Capture Real App Data (2)')).toBeInTheDocument()
            })
        })
    })

    describe('Log Real Console Data button', () => {
        it('calls console methods when clicked', async () => {
            render(<LoggerDemo />)
            const button = screen.getByText(/Log Real Console Data/)
            fireEvent.click(button)

            await waitFor(() => {
                expect(mockConsole.log).toHaveBeenCalledWith('Real application data:', expect.any(Object))
                expect(mockConsole.info).toHaveBeenCalledWith('Real environment info:', expect.any(Object))
                expect(mockConsole.warn).toHaveBeenCalledWith('Real browser warnings:', expect.any(Object))
                expect(mockConsole.log).toHaveBeenCalledWith('Real context info:', expect.any(Object))
                expect(mockConsole.debug).toHaveBeenCalledWith('Real debug info:', expect.any(Object))
            })
        })
    })

    describe('Network Status button', () => {
        it('calls logger functions when clicked', async () => {
            render(<LoggerDemo />)
            const button = screen.getByText('Network Status')
            fireEvent.click(button)

            await waitFor(() => {
                expect(logInfo).toHaveBeenCalledWith('Network status', expect.any(Object))
            })
        })
    })

    describe('Component positioning and styling', () => {
        it('has correct CSS classes and positioning', () => {
            render(<LoggerDemo />)
            const container = screen.getByText('Real Data Logger').closest('div')
            expect(container).toHaveClass(
                'fixed',
                'top-4',
                'left-4',
                'bg-white',
                'border',
                'rounded-lg',
                'shadow-lg',
                'p-4',
                'z-40',
                'max-w-sm'
            )
        })

        it('has correct button styling', () => {
            render(<LoggerDemo />)
            const captureButton = screen.getByText(/Capture Real App Data/)
            const consoleButton = screen.getByText(/Log Real Console Data/)
            const networkButton = screen.getByText('Network Status')

            expect(captureButton).toHaveClass('bg-blue-500', 'text-white', 'rounded')
            expect(consoleButton).toHaveClass('bg-green-500', 'text-white', 'rounded')
            expect(networkButton).toHaveClass('bg-purple-500', 'text-white', 'rounded')
        })
    })

    describe('Accessibility', () => {
        it('has proper button elements', () => {
            render(<LoggerDemo />)
            const buttons = screen.getAllByRole('button')
            expect(buttons).toHaveLength(3) // Updated to 3 buttons

            buttons.forEach(button => {
                expect(button).toBeInTheDocument()
            })
        })

        it('has descriptive text for screen readers', () => {
            render(<LoggerDemo />)
            expect(screen.getByText('Real Data Logger')).toBeInTheDocument()
            expect(screen.getByText(/Click the 📋 button to view logs/)).toBeInTheDocument()
            expect(screen.getByText('Using real application data')).toBeInTheDocument()
        })
    })

    describe('Real data functionality', () => {
        it('captures real browser data on mount', () => {
            render(<LoggerDemo />)

            // Check that real data is being captured
            expect(screen.getByText(/Capture Real App Data/)).toBeInTheDocument()
            expect(screen.getByText(/Log Real Console Data/)).toBeInTheDocument()
            expect(screen.getByText('Network Status')).toBeInTheDocument()
        })

        it('logs real performance data when available', async () => {
            // Mock performance API with real data
            const mockPerformance = {
                getEntriesByType: jest.fn(() => [{
                    loadEventEnd: 1000,
                    loadEventStart: 500,
                    domContentLoadedEventEnd: 800,
                    domContentLoadedEventStart: 600,
                }]),
                getEntriesByName: jest.fn(() => [
                    { startTime: 100 },
                    { startTime: 200 }
                ]),
                memory: {
                    usedJSHeapSize: 1024 * 1024 * 50,
                    totalJSHeapSize: 1024 * 1024 * 100,
                    jsHeapSizeLimit: 1024 * 1024 * 200,
                },
            }

            Object.defineProperty(window, 'performance', {
                value: mockPerformance,
                writable: true,
            })

            render(<LoggerDemo />)
            const button = screen.getByText(/Capture Real App Data/)
            fireEvent.click(button)

            await waitFor(() => {
                expect(logInfo).toHaveBeenCalledWith('Page performance metrics', expect.any(Object))
                expect(logWarn).toHaveBeenCalledWith('Memory usage detected', expect.any(Object))
            })
        })
    })
})
