"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface Source {
    title: string;
    score: number;
}

interface Message {
    role: "user" | "assistant";
    text: string;
    sources?: Source[];
    error?: boolean;
}

const PROMPT_CHIPS = [
    "What should I check for the switchgear hot lug thermal finding?",
    "How do we respond to a methane indication at the gas train?",
    "What are the normal cooling loop temperature and flow ranges?",
    "What triggers a perimeter verification patrol?",
    "What gates commissioning readiness?",
];

function UserBubble({ text }: { text: string }) {
    return (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <div
                style={{
                    maxWidth: "70%",
                    backgroundColor: "#eef3fd",
                    border: "1px solid #c7d8f8",
                    borderRadius: "12px 12px 2px 12px",
                    padding: "10px 14px",
                    fontSize: 14,
                    color: "var(--ds-text-primary)",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                }}
            >
                {text}
            </div>
        </div>
    );
}

function AssistantCard({ text, sources }: { text: string; sources?: Source[] }) {
    const uniqueTitles = [...new Set((sources ?? []).map((s) => s.title))];

    return (
        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
            <div
                style={{
                    maxWidth: "80%",
                    backgroundColor: "var(--ds-card)",
                    border: "1px solid var(--ds-border)",
                    borderRadius: "12px 12px 12px 2px",
                    boxShadow: "var(--ds-shadow)",
                    padding: "14px 16px",
                    fontSize: 14,
                    color: "var(--ds-text-primary)",
                    lineHeight: 1.6,
                }}
            >
                <div style={{ whiteSpace: "pre-wrap" }}>{text}</div>

                {uniqueTitles.length > 0 && (
                    <div
                        style={{
                            marginTop: 12,
                            paddingTop: 10,
                            borderTop: "1px solid var(--ds-border)",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            alignItems: "center",
                        }}
                    >
                        <span
                            style={{
                                fontSize: 11,
                                color: "var(--ds-text-muted)",
                                fontWeight: 500,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                            }}
                        >
                            Sources
                        </span>
                        {uniqueTitles.map((title) => (
                            <span
                                key={title}
                                style={{
                                    fontSize: 11,
                                    backgroundColor: "var(--ds-badge-bg)",
                                    color: "var(--ds-badge-text)",
                                    padding: "2px 8px",
                                    borderRadius: 4,
                                    fontWeight: 500,
                                }}
                            >
                                {title}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ErrorLine() {
    return (
        <div
            style={{
                fontSize: 13,
                color: "var(--ds-sev-high)",
                opacity: 0.8,
                marginBottom: 16,
                paddingLeft: 4,
            }}
        >
            Something went wrong — try again.
        </div>
    );
}

export default function AskPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    async function submit(question: string) {
        const q = question.trim();
        if (!q || loading) return;

        setMessages((prev) => [...prev, { role: "user", text: q }]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/ask", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ question: q }),
            });

            if (!res.ok) {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", text: "", error: true },
                ]);
                return;
            }

            const data = await res.json() as { answer: string; sources: Source[] };
            setMessages((prev) => [
                ...prev,
                { role: "assistant", text: data.answer, sources: data.sources },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", text: "", error: true },
            ]);
        } finally {
            setLoading(false);
            setTimeout(() => textareaRef.current?.focus(), 50);
        }
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        void submit(input);
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void submit(input);
        }
    }

    const isEmpty = messages.length === 0 && !loading;

    return (
        <div
            style={{
                maxWidth: 760,
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                height: "100%",
            }}
        >
            {/* Page header */}
            <div style={{ marginBottom: 24, flexShrink: 0 }}>
                <h1
                    style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: "var(--ds-text-primary)",
                        margin: 0,
                        marginBottom: 4,
                    }}
                >
                    Ask the Facility
                </h1>
                <p
                    style={{
                        fontSize: 13.5,
                        color: "var(--ds-text-secondary)",
                        margin: 0,
                    }}
                >
                    Ask an operations question — answers are sourced from facility documents.
                </p>
            </div>

            {/* Prompt chips — shown when thread is empty */}
            {isEmpty && (
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        marginBottom: 24,
                        flexShrink: 0,
                    }}
                >
                    {PROMPT_CHIPS.map((chip) => (
                        <button
                            key={chip}
                            onClick={() => void submit(chip)}
                            style={{
                                background: "var(--ds-card)",
                                border: "1px solid var(--ds-border)",
                                borderRadius: 8,
                                padding: "8px 12px",
                                fontSize: 13,
                                color: "var(--ds-text-secondary)",
                                cursor: "pointer",
                                textAlign: "left",
                                lineHeight: 1.4,
                                boxShadow: "var(--ds-shadow)",
                                transition: "border-color 0.15s, color 0.15s",
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.borderColor =
                                    "var(--ds-accent)";
                                (e.currentTarget as HTMLButtonElement).style.color =
                                    "var(--ds-accent)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.borderColor =
                                    "var(--ds-border)";
                                (e.currentTarget as HTMLButtonElement).style.color =
                                    "var(--ds-text-secondary)";
                            }}
                        >
                            {chip}
                        </button>
                    ))}
                </div>
            )}

            {/* Message thread */}
            <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
                {messages.map((msg, i) =>
                    msg.role === "user" ? (
                        <UserBubble key={i} text={msg.text} />
                    ) : msg.error ? (
                        <ErrorLine key={i} />
                    ) : (
                        <AssistantCard key={i} text={msg.text} sources={msg.sources} />
                    )
                )}

                {loading && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-start",
                            marginBottom: 16,
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: "var(--ds-card)",
                                border: "1px solid var(--ds-border)",
                                borderRadius: "12px 12px 12px 2px",
                                padding: "14px 16px",
                                fontSize: 13.5,
                                color: "var(--ds-text-muted)",
                                fontStyle: "italic",
                            }}
                        >
                            Searching facility documents…
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <form
                onSubmit={handleSubmit}
                style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-end",
                    flexShrink: 0,
                    paddingBottom: 4,
                }}
            >
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    placeholder="Ask a facility operations question…"
                    rows={2}
                    style={{
                        flex: 1,
                        resize: "none",
                        border: "1px solid var(--ds-border)",
                        borderRadius: 8,
                        padding: "10px 12px",
                        fontSize: 14,
                        fontFamily: "inherit",
                        color: "var(--ds-text-primary)",
                        backgroundColor: loading ? "#f7f8fa" : "var(--ds-card)",
                        outline: "none",
                        lineHeight: 1.5,
                        boxShadow: "var(--ds-shadow)",
                        opacity: loading ? 0.6 : 1,
                    }}
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    style={{
                        backgroundColor: "var(--ds-accent)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 8,
                        padding: "0 16px",
                        height: 44,
                        cursor:
                            loading || !input.trim() ? "not-allowed" : "pointer",
                        opacity: loading || !input.trim() ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 14,
                        fontWeight: 500,
                        flexShrink: 0,
                    }}
                >
                    <Send size={16} strokeWidth={1.5} />
                    Send
                </button>
            </form>
        </div>
    );
}
