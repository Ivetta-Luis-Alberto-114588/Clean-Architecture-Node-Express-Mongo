# Details

Date : 2025-03-07 08:12:01

Directory c:\\Users\\Usuario\\Desktop\\Practica Angular\\14-Clean-Architecture-Node-Express-Mongo\\tests

Total : 37 files,  3978 codes, 1111 comments, 984 blanks, all 6073 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [tests/domain/dtos/auth/register-user.dto.test.ts](/tests/domain/dtos/auth/register-user.dto.test.ts) | TypeScript | 63 | 25 | 19 | 107 |
| [tests/domain/dtos/customers/create-city.dto.test.ts](/tests/domain/dtos/customers/create-city.dto.test.ts) | TypeScript | 61 | 25 | 19 | 105 |
| [tests/domain/dtos/customers/create-customer.dto.test.ts](/tests/domain/dtos/customers/create-customer.dto.test.ts) | TypeScript | 165 | 54 | 41 | 260 |
| [tests/domain/dtos/customers/create-neighborhood.dto.test.ts](/tests/domain/dtos/customers/create-neighborhood.dto.test.ts) | TypeScript | 89 | 34 | 26 | 149 |
| [tests/domain/dtos/customers/update-city.dto.test.ts](/tests/domain/dtos/customers/update-city.dto.test.ts) | TypeScript | 59 | 26 | 20 | 105 |
| [tests/domain/dtos/customers/update-customer.dto.test.ts](/tests/domain/dtos/customers/update-customer.dto.test.ts) | TypeScript | 70 | 25 | 20 | 115 |
| [tests/domain/dtos/customers/update-neighborhood.dto.test.ts](/tests/domain/dtos/customers/update-neighborhood.dto.test.ts) | TypeScript | 73 | 31 | 24 | 128 |
| [tests/domain/dtos/payment/create-payment.dto.test.ts](/tests/domain/dtos/payment/create-payment.dto.test.ts) | TypeScript | 196 | 28 | 67 | 291 |
| [tests/domain/dtos/payment/process-webhook.dto.test.ts](/tests/domain/dtos/payment/process-webhook.dto.test.ts) | TypeScript | 95 | 28 | 28 | 151 |
| [tests/domain/dtos/payment/update-payment-status.dto.test.ts](/tests/domain/dtos/payment/update-payment-status.dto.test.ts) | TypeScript | 98 | 31 | 28 | 157 |
| [tests/domain/dtos/payment/verify-payment.dto.test.ts](/tests/domain/dtos/payment/verify-payment.dto.test.ts) | TypeScript | 89 | 30 | 28 | 147 |
| [tests/domain/dtos/products/create-category.dto.test.ts](/tests/domain/dtos/products/create-category.dto.test.ts) | TypeScript | 75 | 31 | 21 | 127 |
| [tests/domain/dtos/products/create-product.dto.test.ts](/tests/domain/dtos/products/create-product.dto.test.ts) | TypeScript | 167 | 44 | 35 | 246 |
| [tests/domain/dtos/products/create-unit.dto.test.ts](/tests/domain/dtos/products/create-unit.dto.test.ts) | TypeScript | 96 | 38 | 29 | 163 |
| [tests/domain/dtos/products/update-category.dto.test.ts](/tests/domain/dtos/products/update-category.dto.test.ts) | TypeScript | 81 | 36 | 28 | 145 |
| [tests/domain/dtos/products/update-product.dto.test.ts](/tests/domain/dtos/products/update-product.dto.test.ts) | TypeScript | 101 | 36 | 28 | 165 |
| [tests/domain/dtos/products/update-unit.dto.test.ts](/tests/domain/dtos/products/update-unit.dto.test.ts) | TypeScript | 83 | 31 | 23 | 137 |
| [tests/domain/dtos/sales/create-sale.dto.test.ts](/tests/domain/dtos/sales/create-sale.dto.test.ts) | TypeScript | 184 | 55 | 41 | 280 |
| [tests/domain/dtos/sales/update-sale-status.dto.test.ts](/tests/domain/dtos/sales/update-sale-status.dto.test.ts) | TypeScript | 79 | 37 | 25 | 141 |
| [tests/domain/dtos/shared/pagination.dto.test.ts](/tests/domain/dtos/shared/pagination.dto.test.ts) | TypeScript | 49 | 23 | 16 | 88 |
| [tests/domain/entities/customers/city.entity.test.ts](/tests/domain/entities/customers/city.entity.test.ts) | TypeScript | 58 | 29 | 19 | 106 |
| [tests/domain/entities/customers/customer.entity.test.ts](/tests/domain/entities/customers/customer.entity.test.ts) | TypeScript | 118 | 21 | 17 | 156 |
| [tests/domain/entities/customers/neighborhood.entity.test.ts](/tests/domain/entities/customers/neighborhood.entity.test.ts) | TypeScript | 118 | 25 | 20 | 163 |
| [tests/domain/entities/payment/payment.entity.test.ts](/tests/domain/entities/payment/payment.entity.test.ts) | TypeScript | 326 | 27 | 30 | 383 |
| [tests/domain/use-cases/auth/register-user.use-case.test.ts](/tests/domain/use-cases/auth/register-user.use-case.test.ts) | TypeScript | 78 | 22 | 19 | 119 |
| [tests/domain/use-cases/customers/create-city.use-case.test.ts](/tests/domain/use-cases/customers/create-city.use-case.test.ts) | TypeScript | 99 | 32 | 28 | 159 |
| [tests/domain/use-cases/customers/create-customer.use-case.test.ts](/tests/domain/use-cases/customers/create-customer.use-case.test.ts) | TypeScript | 138 | 30 | 31 | 199 |
| [tests/domain/use-cases/customers/create-neighborhood.use-case.test.ts](/tests/domain/use-cases/customers/create-neighborhood.use-case.test.ts) | TypeScript | 142 | 37 | 36 | 215 |
| [tests/domain/use-cases/product/create-product.use-case.test.ts](/tests/domain/use-cases/product/create-product.use-case.test.ts) | TypeScript | 103 | 24 | 21 | 148 |
| [tests/integration/auth/auth-routes.test.ts](/tests/integration/auth/auth-routes.test.ts) | TypeScript | 89 | 20 | 23 | 132 |
| [tests/integration/products/product-routes.test.ts](/tests/integration/products/product-routes.test.ts) | TypeScript | 281 | 58 | 61 | 400 |
| [tests/presentation/auth/controller.auth.test.ts](/tests/presentation/auth/controller.auth.test.ts) | TypeScript | 123 | 42 | 38 | 203 |
| [tests/presentation/products/controller.product.test.ts](/tests/presentation/products/controller.product.test.ts) | TypeScript | 246 | 61 | 55 | 362 |
| [tests/utils/global-setup.ts](/tests/utils/global-setup.ts) | TypeScript | 18 | 4 | 5 | 27 |
| [tests/utils/global-teardown.ts](/tests/utils/global-teardown.ts) | TypeScript | 6 | 2 | 1 | 9 |
| [tests/utils/setup.ts](/tests/utils/setup.ts) | TypeScript | 27 | 5 | 10 | 42 |
| [tests/utils/test-utils.ts](/tests/utils/test-utils.ts) | TypeScript | 35 | 4 | 4 | 43 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)