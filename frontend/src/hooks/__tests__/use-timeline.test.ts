import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { useTimeline, useTimelineByDate, useCreateTimelineEntry } from '../use-timeline'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { logInfo, logError } from '@/lib/logger'

// Mock the logger
jest.mock('@/lib/logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

// Create a test query client
const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    })

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => {
    const queryClient = createTestQueryClient()
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('Timeline Hooks', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('useTimeline', () => {
        it('should fetch timeline data successfully', async () => {
            const mockData = [
                { id: '1', title: 'Task 1', content: 'Content 1', date: '2024-01-01' },
                { id: '2', title: 'Task 2', content: 'Content 2', date: '2024-01-02' },
            ]

                ; (fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockData,
                })

            const { result } = renderHook(() => useTimeline(), { wrapper })

            await waitFor(() => {
                expect(result.current.data).toEqual(mockData)
                expect(result.current.isLoading).toBe(false)
                expect(result.current.error).toBeNull()
            })

            expect(fetch).toHaveBeenCalledWith('/api/timeline')
        })

        it('should handle fetch error', async () => {
            const errorMessage = 'Failed to fetch timeline'
                ; (fetch as jest.Mock).mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                })

            const { result } = renderHook(() => useTimeline(), { wrapper })

            await waitFor(() => {
                expect(result.current.error).toBeTruthy()
                expect(result.current.isLoading).toBe(false)
            })
        })

        it('should log success when data is fetched', async () => {
            const mockData = [{ id: '1', title: 'Task 1', content: 'Content 1', date: '2024-01-01' }]

                ; (fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockData,
                })

            renderHook(() => useTimeline(), { wrapper })

            await waitFor(() => {
                expect(logInfo).toHaveBeenCalledWith('Timeline fetched successfully', { count: 1 })
            })
        })

        it('should log error when fetch fails', async () => {
            ; (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
            })

            renderHook(() => useTimeline(), { wrapper })

            await waitFor(() => {
                expect(logError).toHaveBeenCalledWith('Failed to fetch timeline', expect.any(Error))
            })
        })
    })

    describe('useTimelineByDate', () => {
        it('should fetch timeline by date when date is provided', async () => {
            const date = '2024-01-01'
            const mockData = [{ id: '1', title: 'Task 1', content: 'Content 1', date }]

                ; (fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockData,
                })

            const { result } = renderHook(() => useTimelineByDate(date), { wrapper })

            await waitFor(() => {
                expect(result.current.data).toEqual(mockData)
                expect(result.current.isLoading).toBe(false)
            })

            expect(fetch).toHaveBeenCalledWith(`/api/timeline?date=${date}`)
        })

        it('should not fetch when date is empty', () => {
            const { result } = renderHook(() => useTimelineByDate(''), { wrapper })

            expect(result.current.isLoading).toBe(false)
            expect(fetch).not.toHaveBeenCalled()
        })

        it('should log success when data is fetched by date', async () => {
            const date = '2024-01-01'
            const mockData = [{ id: '1', title: 'Task 1', content: 'Content 1', date }]

                ; (fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockData,
                })

            renderHook(() => useTimelineByDate(date), { wrapper })

            await waitFor(() => {
                expect(logInfo).toHaveBeenCalledWith('Timeline by date fetched successfully', {
                    date,
                    count: 1
                })
            })
        })
    })

    describe('useCreateTimelineEntry', () => {
        it('should create timeline entry successfully', async () => {
            const newEntry = {
                title: 'New Task',
                content: 'New content',
                date: '2024-01-01',
            }

            const createdEntry = {
                id: 'new-id',
                ...newEntry,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            }

                ; (fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => createdEntry,
                })

            const { result } = renderHook(() => useCreateTimelineEntry(), { wrapper })

            result.current.mutate(newEntry)

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
                expect(result.current.data).toEqual(createdEntry)
            })

            expect(fetch).toHaveBeenCalledWith('/api/timeline', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newEntry),
            })
        })

        it('should handle creation error', async () => {
            const newEntry = {
                title: 'New Task',
                content: 'New content',
                date: '2024-01-01',
            }

                ; (fetch as jest.Mock).mockResolvedValueOnce({
                    ok: false,
                    status: 400,
                })

            const { result } = renderHook(() => useCreateTimelineEntry(), { wrapper })

            result.current.mutate(newEntry)

            await waitFor(() => {
                expect(result.current.isError).toBe(true)
                expect(result.current.error).toBeTruthy()
            })
        })

        it('should log success when entry is created', async () => {
            const newEntry = {
                title: 'New Task',
                content: 'New content',
                date: '2024-01-01',
            }

            const createdEntry = {
                id: 'new-id',
                ...newEntry,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            }

                ; (fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => createdEntry,
                })

            const { result } = renderHook(() => useCreateTimelineEntry(), { wrapper })

            result.current.mutate(newEntry)

            await waitFor(() => {
                expect(logInfo).toHaveBeenCalledWith('Timeline entry created successfully', {
                    entryId: 'new-id'
                })
            })
        })
    })
})
