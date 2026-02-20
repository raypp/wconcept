/**
 * Google Stitch MCP API 클라이언트
 * MCP over HTTP (Streamable HTTP Transport) 방식으로 통신
 */

const MCP_URL = import.meta.env.VITE_STITCH_MCP_URL as string;
const API_KEY = import.meta.env.VITE_STITCH_API_KEY as string;

let requestId = 1;

// MCP 세션 ID (initialize 이후 서버가 반환)
let sessionId: string | null = null;

/** MCP JSON-RPC 요청 전송 */
async function mcpRequest(method: string, params: Record<string, unknown> = {}) {
    const id = requestId++;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'X-Goog-Api-Key': API_KEY,
    };
    if (sessionId) {
        headers['Mcp-Session-Id'] = sessionId;
    }

    const body = JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params,
    });

    const res = await fetch(MCP_URL, { method: 'POST', headers, body });

    // 세션 ID 저장
    const sid = res.headers.get('Mcp-Session-Id');
    if (sid) sessionId = sid;

    const text = await res.text();

    // SSE 스트림인 경우 마지막 data: 블록 파싱
    if (text.startsWith('data:') || text.includes('\ndata:')) {
        const lastData = text
            .split('\n')
            .filter(l => l.startsWith('data:'))
            .pop()
            ?.replace(/^data:\s*/, '');
        if (lastData) return JSON.parse(lastData);
    }

    return JSON.parse(text);
}

/** MCP 초기화 (세션 수립) */
async function initialize() {
    if (sessionId) return; // 이미 초기화됨
    const res = await mcpRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'w-concept-tracking', version: '1.0.0' },
    });
    if (res?.result) {
        // initialized 알림 전송
        await mcpRequest('notifications/initialized', {});
    }
}

/** Stitch 툴 호출 헬퍼 */
async function callTool(name: string, args: Record<string, unknown> = {}) {
    await initialize();
    const res = await mcpRequest('tools/call', { name, arguments: args });
    if (res?.error) throw new Error(res.error.message ?? 'Stitch API error');
    return res?.result;
}

// ─── 공개 API ─────────────────────────────────────────────────

export interface StitchProject {
    id: string;
    name: string;
    description?: string;
    updated_at?: string;
}

export interface StitchScreen {
    id: string;
    name: string;
    project_id: string;
    thumbnail_url?: string;
}

/** 프로젝트 목록 조회 */
export async function listProjects(): Promise<StitchProject[]> {
    const result = await callTool('list_projects');
    // result.content 배열에서 text JSON 파싱
    const text = result?.content?.[0]?.text;
    if (!text) return [];
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : parsed.projects ?? [];
    } catch {
        return [];
    }
}

/** 특정 프로젝트의 스크린 목록 조회 */
export async function listScreens(projectId: string): Promise<StitchScreen[]> {
    const result = await callTool('list_screens', { project_id: projectId });
    const text = result?.content?.[0]?.text;
    if (!text) return [];
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : parsed.screens ?? [];
    } catch {
        return [];
    }
}

/** 스크린 이미지 URL 가져오기 */
export async function fetchScreenImage(screenId: string, projectId: string): Promise<string | null> {
    const result = await callTool('fetch_screen_image', {
        screen_id: screenId,
        project_id: projectId,
    });
    // 이미지 데이터 또는 URL 반환
    const content = result?.content?.[0];
    if (!content) return null;
    if (content.type === 'image') return `data:${content.mimeType};base64,${content.data}`;
    if (content.type === 'text') return content.text; // URL인 경우
    return null;
}

/** 텍스트 프롬프트로 스크린 생성 */
export async function generateScreenFromText(
    projectId: string,
    prompt: string,
): Promise<StitchScreen | null> {
    const result = await callTool('generate_screen_from_text', {
        project_id: projectId,
        prompt,
    });
    const text = result?.content?.[0]?.text;
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}
