// src/domain/dtos/mcp/mcp-call.dto.ts

export class MCPCallDto {
    private constructor(
        public readonly toolName: string,
        public readonly args: Record<string, any>
    ) { }

    static create(object: { [key: string]: any }): [string?, MCPCallDto?] {
        const { toolName, arguments: args } = object;    // Validaciones
        if (toolName === undefined || toolName === null) {
            return ['Tool name is required'];
        }

        if (typeof toolName !== 'string') {
            return ['Tool name must be a non-empty string'];
        }

        if (toolName.trim().length === 0) {
            return ['Tool name must be a non-empty string'];
        }

        if (!args || typeof args !== 'object') {
            return ['Arguments must be an object'];
        } return [undefined, new MCPCallDto(toolName.trim(), args)];
    }

    // Método para validar que los argumentos contengan las propiedades requeridas
    validateRequiredArgs(requiredFields: string[]): string | undefined {
        for (const field of requiredFields) {
            if (!(field in this.args) || this.args[field] === undefined || this.args[field] === null) {
                return `Required field '${field}' is missing`;
            }
        }
        return undefined;
    }
}
