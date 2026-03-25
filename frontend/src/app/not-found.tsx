'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
                    <div className="text-center space-y-8">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl animate-pulse shadow-lg"></div>
                        <h1 className="text-4xl font-bold text-gray-800">Something went wrong!</h1>
                        <p className="text-lg text-gray-600">An error occurred while loading the page.</p>
                        <button
                            onClick={reset}
                            className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}

