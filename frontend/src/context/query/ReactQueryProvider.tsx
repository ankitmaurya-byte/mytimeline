"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthSetup } from "@/components/auth/AuthSetup";

type Props = { children: ReactNode };

// Draggable wrapper for ReactQuery Devtools
function DraggableDevtools() {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const devtoolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!devtoolsRef.current) return;

    const rect = devtoolsRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  return (
    <div
      ref={devtoolsRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 99999,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      <ReactQueryDevtools
        initialIsOpen={false}
      // position="bottom-right"
      // expanderButtonPosition="bottom-right"
      />
    </div>
  );
}

export default function ReactQueryProvider({ children }: Props) {
  const [client] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false, // Reduce unnecessary refetches
          refetchOnMount: false, // Don't refetch on mount if data is fresh
          refetchOnReconnect: false, // Don't refetch on reconnect
          retry: 1,
          staleTime: 5 * 60 * 1000, // 5 minutes for better caching
          gcTime: 15 * 60 * 1000, // 15 minutes cache time
        },
        mutations: {
          retry: 0,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={client}>
      <AuthSetup />
      {children}
      {/* Only load devtools in development */}
      {process.env.NODE_ENV === 'development' && <DraggableDevtools />}
    </QueryClientProvider>
  );
}
