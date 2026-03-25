// Native EmojiPickerComponent - Ultra lightweight replacement
import React from "react";
import { NativeEmojiPicker } from "./NativeEmojiPicker";

interface EmojiPickerComponentProps {
  onSelectEmoji: (emoji: string) => void;
  disablePopover?: boolean;
}

const EmojiPickerComponent: React.FC<EmojiPickerComponentProps> = ({
  onSelectEmoji,
  disablePopover = false,
}) => {
  if (disablePopover) {
    // When used inside another popover, just render the content directly
    return (
      <div className="relative w-full">
        <NativeEmojiPicker onSelectEmoji={onSelectEmoji} disablePopover={true} />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <NativeEmojiPicker onSelectEmoji={onSelectEmoji} />
    </div>
  );
};

export default EmojiPickerComponent;
