"use client";
import React from 'react';

interface TourErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface TourErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

class TourErrorBoundary extends React.Component<TourErrorBoundaryProps, TourErrorBoundaryState> {
    constructor(props: TourErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): TourErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error in production
        if (process.env.NODE_ENV === 'production') {
            console.error('Tour Error Boundary caught an error:', error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI for production
            return this.props.fallback || (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Tour Unavailable
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            The tour guide encountered an issue. You can continue using the application normally.
                        </p>
                        <button
                            onClick={() => this.setState({ hasError: false })}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default TourErrorBoundary;

