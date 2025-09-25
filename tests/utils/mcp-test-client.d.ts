/**
 * MCP Test Client - Utilities for testing MCP protocol communication
 */
import { EventEmitter } from 'events';
export interface MCPRequest {
    jsonrpc: '2.0';
    id: number | string;
    method: string;
    params?: any;
}
export interface MCPResponse {
    jsonrpc: '2.0';
    id: number | string;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}
export interface MCPToolCall {
    name: string;
    arguments: any;
}
export declare class MCPTestClient extends EventEmitter {
    private serverPath;
    private process;
    private requestId;
    private pendingRequests;
    private responseBuffer;
    constructor(serverPath?: string);
    start(): Promise<void>;
    stop(): Promise<void>;
    listTools(): Promise<any[]>;
    callTool(name: string, args: any): Promise<any>;
    sendRequest(method: string, params?: any): Promise<MCPResponse>;
    private handleResponse;
    private handleParsedResponse;
}
export declare function withMCPClient<T>(testFn: (client: MCPTestClient) => Promise<T>, serverPath?: string): Promise<T>;
export declare function createMockMCPResponse(id: string | number, result?: any, error?: any): MCPResponse;
export declare function createToolCallRequest(name: string, args: any): MCPToolCall;
export declare function validateMCPResponse(response: MCPResponse): void;
export declare function validateToolResponse(response: any): void;
export declare function parseToolResponseData(response: any): any;
//# sourceMappingURL=mcp-test-client.d.ts.map