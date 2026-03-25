'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Smile } from 'lucide-react';

interface NativeEmojiPickerProps {
    onSelectEmoji: (emoji: string) => void;
    children?: React.ReactNode;
    disablePopover?: boolean;
}

interface EmojiData {
    [emoji: string]: string[];
}

interface EmojiSearchData {
    [emoji: string]: string[];
}

const NativeEmojiPicker: React.FC<NativeEmojiPickerProps> = ({ onSelectEmoji, children, disablePopover = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredEmojis, setFilteredEmojis] = useState<string[]>([]);
    const [allEmojis, setAllEmojis] = useState<string[]>([]);
    const [emojiSearchData, setEmojiSearchData] = useState<EmojiSearchData>({});
    const [isLoading, setIsLoading] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load emoji data from the JSON file
    useEffect(() => {
        const loadEmojiData = async () => {
            try {
                const response = await fetch('/emoji-en-US.json');
                const emojiData: EmojiData = await response.json();
                const emojiList = Object.keys(emojiData);
                setAllEmojis(emojiList);
                setFilteredEmojis(emojiList);
                setEmojiSearchData(emojiData);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to load emoji data:', error);
                // Fallback to a small set of common emojis
                const fallbackEmojis = [
                    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
                    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
                    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '👏',
                    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️'
                ];
                setAllEmojis(fallbackEmojis);
                setFilteredEmojis(fallbackEmojis);
                setIsLoading(false);
            }
        };

        loadEmojiData();
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredEmojis(allEmojis);
            return;
        }

        const filtered = allEmojis.filter(emoji => {
            // Enhanced search - search through emoji names and keywords from JSON
            const searchLower = searchTerm.toLowerCase();

            // Check if emoji character matches
            if (emoji.includes(searchTerm) || emoji.toLowerCase().includes(searchLower)) {
                return true;
            }

            // Check if any keywords match using the comprehensive JSON data
            const keywords = emojiSearchData[emoji] || [];
            return keywords.some(keyword => keyword.toLowerCase().includes(searchLower));
        });

        setFilteredEmojis(filtered);
    }, [searchTerm, allEmojis, emojiSearchData]);

    const handleEmojiClick = (emoji: string) => {
        onSelectEmoji(emoji);
        setIsOpen(false);
        setSearchTerm('');
    };

    // If popover is disabled, just render the content directly
    if (disablePopover) {
        return (
            <div className="w-80 p-2">
                {isLoading ? (
                    <div className="flex items-center justify-center h-60">
                        <div className="text-sm text-muted-foreground">Loading emojis...</div>
                    </div>
                ) : (
                    <>
                        <Input
                            ref={inputRef}
                            placeholder="Search emojis... (e.g., 'grinning', 'heart', 'thumbs_up', 'laughing')"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mb-2"
                            autoFocus
                        />
                        <ScrollArea className="h-60">
                            <div className="grid grid-cols-8 gap-1 p-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)' }}>
                                {filteredEmojis.map((emoji, index) => (
                                    <button
                                        key={index}
                                        className="text-xl p-1 h-8 w-8 flex items-center justify-center hover:bg-accent rounded-md border-0 bg-transparent cursor-pointer transition-colors"
                                        onClick={() => handleEmojiClick(emoji)}
                                        title={emoji}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                            {filteredEmojis.length === 0 && !isLoading && (
                                <div className="text-center text-sm text-muted-foreground py-8">
                                    No emojis found for "{searchTerm}"
                                    <div className="text-xs mt-1">
                                        Try searching for: grinning, heart, thumbs_up, laughing, happy, etc.
                                    </div>
                                </div>
                            )}
                        </ScrollArea>
                    </>
                )}
            </div>
        );
    }

    return (
        <Popover open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
                setSearchTerm('');
            }
        }}>
            <PopoverTrigger asChild>
                {children || (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                    >
                        <Smile className="h-5 w-5 text-muted-foreground" />
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent
                className="w-80 p-2"
                onOpenAutoFocus={(e) => e.preventDefault()}
                side="top"
                align="end"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-60">
                        <div className="text-sm text-muted-foreground">Loading emojis...</div>
                    </div>
                ) : (
                    <>
                        <Input
                            ref={inputRef}
                            placeholder="Search emojis... (e.g., 'grinning', 'heart', 'thumbs_up', 'laughing')"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mb-2"
                            autoFocus
                        />
                        <ScrollArea className="h-60">
                            <div className="grid grid-cols-8 gap-1 p-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)' }}>
                                {filteredEmojis.map((emoji, index) => (
                                    <button
                                        key={index}
                                        className="text-xl p-1 h-8 w-8 flex items-center justify-center hover:bg-accent rounded-md border-0 bg-transparent cursor-pointer transition-colors"
                                        onClick={() => handleEmojiClick(emoji)}
                                        title={emoji}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                            {filteredEmojis.length === 0 && !isLoading && (
                                <div className="text-center text-sm text-muted-foreground py-8">
                                    No emojis found for "{searchTerm}"
                                    <div className="text-xs mt-1">
                                        Try searching for: grinning, heart, thumbs_up, laughing, happy, etc.
                                    </div>
                                </div>
                            )}
                        </ScrollArea>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
};

export { NativeEmojiPicker };
