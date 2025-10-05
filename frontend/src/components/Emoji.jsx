import React from "react";

const EMOJIS = ["😀", "😂", "😍", "😎", "🥳", "😭", "👍", "🙏", "🎉", "💖"];

function Emoji({ onSelect }) {
    return (
        <div className="absolute bottom-20 left- bg-white rounded-xl p-3 grid grid-cols-5 gap-2 shadow-lg border border-gray-200">
            {EMOJIS.map((emoji, index) => (
                <button
                    key={index}
                    type="button"
                    className="text-2xl hover:bg-gray-200 rounded transition-colors cursor-pointer"
                    onClick={() => onSelect && onSelect(emoji)}
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
}

export default Emoji;
