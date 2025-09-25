/**
 * Jest Test Setup
 * Global test setup and configuration
 */
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidMCPResponse(): R;
            toBeValidPromptResponse(): R;
        }
    }
}
declare const originalConsoleError: (message?: any, ...optionalParams: any[]) => void;
declare const originalConsoleWarn: (message?: any, ...optionalParams: any[]) => void;
//# sourceMappingURL=setup.d.ts.map