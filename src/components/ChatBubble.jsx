
import React from "react";

export default function ChatBubble({ role, text, hits }) {
  const isUser = role === "user";
  return (
    <div className={isUser ? "text-right" : "text-left"}>
      <div
        className={
          "inline-block max-w-[90%] rounded-2xl px-3 py-2 text-sm " +
          (isUser ? "bg-gray-900 text-white" : "bg-gray-100")
        }
      >
        <div className="whitespace-pre-wrap break-words">{text}</div>
        {!isUser && Array.isArray(hits) && hits.length > 0 && (
          <div className="mt-2 text-[11px] text-gray-600 space-y-1">
            <div className="font-medium">Fuentes:</div>
            {hits.map((h, i) => (
              <div key={i}>
                • <span className="font-medium">{h.title}</span>
                {typeof h.page === "number" ? ` — pág. ${h.page}` : ""}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
