// src/domain/entities/products/tag.entity.ts
export class TagEntity {
    constructor(
        public id: string,
        public name: string,       // Ej: "popular", "combo", "oferta", "nuevo"
        public description?: string, // Opcional
        public isActive?: boolean,   // Por si quieres desactivar una etiqueta temporalmente
        public createdAt?: Date,
        public updatedAt?: Date,
    ) { }
}