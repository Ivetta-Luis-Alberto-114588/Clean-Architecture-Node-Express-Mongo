// src/presentation/mcp/routes.mcp.ts
import { Router } from "express";
import { MCPController } from "./controller.mcp";
import { MCPRepositoryImpl } from "../../infrastructure/repositories/mcp/mcp.repository.impl";
import { MCPDataSourceImpl } from "../../infrastructure/datasources/mcp/mcp.datasource.impl";

// Importar repositorios existentes
import { ProductMongoDataSourceImpl } from "../../infrastructure/datasources/products/product.mongo.datasource.impl";
import { CustomerMongoDataSourceImpl } from "../../infrastructure/datasources/customers/customer.mongo.datasource.impl";
import { OrderMongoDataSourceImpl } from "../../infrastructure/datasources/order/order.mongo.datasource.impl";
import { ProductRepositoryImpl } from "../../infrastructure/repositories/products/product.repository.impl";
import { CustomerRepositoryImpl } from "../../infrastructure/repositories/customers/customer.repository.impl";
import { OrderRepositoryImpl } from "../../infrastructure/repositories/order/order.repository.impl";

export class MCPRoutes {
  static get getMCPRoutes(): Router {
    const router = Router();
    
    // Inicializar datasources existentes
    const productDataSource = new ProductMongoDataSourceImpl();
    const customerDataSource = new CustomerMongoDataSourceImpl();
    const orderDataSource = new OrderMongoDataSourceImpl();
    
    // Inicializar repositorios existentes
    const productRepository = new ProductRepositoryImpl(productDataSource);
    const customerRepository = new CustomerRepositoryImpl(customerDataSource);
    const orderRepository = new OrderRepositoryImpl(orderDataSource);
    
    // Inicializar MCP
    const mcpDataSource = new MCPDataSourceImpl(
      productRepository,
      customerRepository,
      orderRepository
    );
    const mcpRepository = new MCPRepositoryImpl(mcpDataSource);
    const controller = new MCPController(mcpRepository);
    
    // Rutas públicas (puedes agregar autenticación si es necesario)
    router.get('/health', controller.healthCheck);
    router.get('/tools', controller.listTools);
    router.post('/call', controller.callTool);
    
    return router;
  }
}
