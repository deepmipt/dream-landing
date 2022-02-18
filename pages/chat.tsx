import React, { useState, useCallback, FC, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import type { NextPage } from "next";
import html2canvas from "html2canvas";

import styles from "./chat.module.css";

interface Message {
  sender: "bot" | "user";
  type: "text";
  content: string;
}

interface UseChatReturn {
  sendMsg: (msg: string) => void;
  messages: Message[];
  error: string | null;
  loading: boolean;
}

interface MsgRequest {
  user_id: string;
  payload: string;
}

interface MsgResponse {
  dialog_id: string;
  utt_id: string;
  user_id: string;
  response: string;
  active_skill: string;
}

const API_URL = "https://7019.lnsigo.mipt.ru/";

const useChat = (): UseChatReturn => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [userId, setUserId] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = localStorage.getItem("user_id");
      if (stored) return stored;
    }
    return nanoid();
  });
  useEffect(() => {
    if (userId && typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("user_id", userId);
    }
  }, [userId]);

  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = localStorage.getItem("messages");
      if (stored) return JSON.parse(stored);
    }
    return [];
  });
  const addMsg = (msg: Message) => setMessages((msgs) => [...msgs, msg]);
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const jsonMsgs = JSON.stringify(messages);
      localStorage.setItem("messages", jsonMsgs);
    }
  }, [messages.length]);

  const sendMsg = useCallback(
    (msgText: string) => {
      if (error) setError(null);

      addMsg({
        sender: "user",
        type: "text",
        content: msgText,
      });
      setLoading(true);

      const body: MsgRequest = {
        user_id: userId,
        payload: msgText,
      };
      fetch(API_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
        .then((res) => res.json())
        .then((res: MsgResponse) => {
          addMsg({
            sender: "bot",
            type: "text",
            content: res.response,
          });
        })
        .catch((err) => setError(err))
        .finally(() => setLoading(false));
    },
    [userId]
  );

  return {
    messages,
    sendMsg,
    error,
    loading,
  };
};

const MessageBubble: FC<{ msg: Message; isNew: boolean }> = ({
  msg,
  isNew,
}) => {
  const isRight = msg.sender === "bot";
  const divRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isNew && divRef.current) {
      divRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isNew]);
  return (
    <div
      ref={divRef}
      className={
        styles["bubble-wrap"] + ` ${isRight ? styles["bubble-wrap-right"] : ""}`
      }
    >
      <div className={styles["bubble"]}>{msg.content}</div>
    </div>
  );
};

const ThinkingBubble: FC = () => {
  const [msg, setMsg] = useState("...");
  useEffect(() => {
    const handle = setInterval(() => {
      setMsg((msg) => (msg.length >= 4 ? "." : msg + "."));
    }, 200);
    return () => clearInterval(handle);
  }, []);

  return (
    <MessageBubble
      msg={{
        sender: "bot",
        type: "text",
        content: msg,
      }}
      isNew
    />
  );
};

const Chat: NextPage = () => {
  const { messages, loading, error, sendMsg } = useChat();

  const chatRef = useRef<HTMLDivElement>(null);
  const getChatPic = () => {
    if (!chatRef.current) return;
    html2canvas(chatRef.current).then((canvas) => {
      const imgDataUrl = canvas.toDataURL();
      const a = document.createElement("a");
      a.download = "canvas_image.png";
      a.href = imgDataUrl;
      a.click();
    });
  };

  return (
    <div className="page">
      <h2>Chat with Dream!</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div ref={chatRef} className={styles["chat-cont"]}>
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            msg={msg}
            isNew={i === messages.length - 1 && !loading}
          />
        ))}
        {loading && <ThinkingBubble />}
      </div>
      <div className={styles['btns-cont']}>
        <input
          type="text"
          placeholder="Type your message here..."
          style={{flexGrow: 1, padding: '3px 4px'}}
          onKeyDown={(ev) =>
            ev.key === "Enter" &&
            (ev.target as HTMLInputElement).value !== "" &&
            (sendMsg((ev.target as HTMLInputElement).value),
            ((ev.target as HTMLInputElement).value = ""))
          }
        />
        <button onClick={getChatPic} style={{flexGrow: 0, marginLeft: '10px'}}>Share conversation</button>
      </div>
    </div>
  );
};

export default Chat;
