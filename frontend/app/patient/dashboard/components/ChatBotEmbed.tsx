"use client";

import { useEffect } from "react";

export default function ChatBotEmbed() {
    useEffect(() => {
        // Prevent multiple injections if React strict mode double-fires
        if (document.getElementById('jotform-agent-script')) return;

        const jfAgentCacheName = 'dynamic-agent-v1';

        const sanitizeVariables = (url: string, width: string | number, height: string | number) => {
            try {
                const sanitizedUrl = new URL(url);
                const safeUrl = sanitizedUrl.toString();
                const safeWidth = parseInt(width as string);
                const safeHeight = parseInt(height as string);
                return { url: safeUrl, width: safeWidth, height: safeHeight };
            } catch (e) {
                console.error('Error sanitizing variables', e);
                return { url: '', width: 0, height: 0 };
            }
        };

        const handlePictureInPictureRequest = async (event: MessageEvent) => {
            if (event.data.type !== 'jf-request-pip-window') {
                return;
            }
            const { _url, _width, _height } = event.data;
            const { url, width, height } = sanitizeVariables(_url, _width, _height);
            if (url === '' || width === 0 || height === 0) {
                return;
            }
            if ('documentPictureInPicture' in window) {
                const dpip = (window as any).documentPictureInPicture;
                // return if already in picture in picture mode
                if (dpip.window) {
                    return;
                }
                const pipWindow = await dpip.requestWindow({
                    width,
                    height,
                    disallowReturnToOpener: true
                });
                // copy styles from main window to pip window
                [...document.styleSheets].forEach(styleSheet => {
                    try {
                        const cssRules = [...styleSheet.cssRules]
                            .map(rule => rule.cssText)
                            .join('');
                        const style = document.createElement('style');
                        style.textContent = cssRules;
                        pipWindow.document.head.appendChild(style);
                    } catch (e) {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.type = styleSheet.type;
                        link.media = styleSheet.media;
                        link.href = styleSheet.href;
                        pipWindow.document.head.appendChild(link);
                    }
                });
                pipWindow.document.body.innerHTML = `<iframe src="${url}" style="width: ${width}px; height: ${height}px;" allow="microphone *; display-capture *;"></iframe>`;
                return { success: true, isActive: false };
            }
        };

        window.addEventListener('message', handlePictureInPictureRequest);

        const src = "https://www.noupe.com/s/umd/109ea7cd2f3/for-embedded-agent.js";
        const script = document.createElement('script');
        script.id = 'jotform-agent-script';
        script.src = src;
        script.async = true;
        script.onload = function () {
            if ((window as any).AgentInitializer && (window as any).AgentInitializer.init) {
                (window as any).AgentInitializer.init({
                    agentRenderURL: "https://www.noupe.com/agent/019c9a9a353170d98a2dfe704cbaa00e59e3",
                    rootId: "JotformAgent-019c9a9a353170d98a2dfe704cbaa00e59e3",
                    formID: "019c9a9a353170d98a2dfe704cbaa00e59e3",
                    contextID: "019c9aad4e977722bf2975463a8a2e63c6e2",
                    initialContext: "",
                    queryParams: ["skipWelcome=1", "maximizable=1", "skipWelcome=1", "maximizable=1", "isNoupeAgent=1", "isNoupeLogo=0", "noupeSelectedColor=%234f4242", "B_VARIANT_AUTO_OPEN_NOUPE_CHATBOT_ON_PREVIEW=34462"],
                    domain: "https://www.noupe.com",
                    isDraggable: false,
                    background: "linear-gradient(180deg, #6C73A8 0%, #6C73A8 100%)",
                    buttonBackgroundColor: "#0066C3",
                    buttonIconColor: "#FFFFFF",
                    inputTextColor: "#01105C",
                    variant: false,
                    customizations: { "greeting": "Yes", "greetingMessage": "Hi! How can I assist you?", "openByDefault": "No", "pulse": "Yes", "position": "right", "autoOpenChatIn": "0", "layout": "square" },
                    isVoice: false,
                    isVoiceWebCallEnabled: false
                });
            }
        };
        document.head.appendChild(script);

        return () => {
            window.removeEventListener('message', handlePictureInPictureRequest);
        };
    }, []);

    return null;
}
