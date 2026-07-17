"use strict";
// =============================================================================
// Gym Management System - Database Seed Script
// Seeds: 6 Roles, 2 Modules, 1 Admin User, Admin Permissions
// Run: npx prisma db seed
// =============================================================================
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcryptjs_1 = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var roles, _i, roles_1, role, modules, _a, modules_1, mod, adminRole, hashedPassword, adminUser, allModules, _b, allModules_1, mod;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log("🌱 Seeding database...\n");
                    roles = [
                        { name: "Super Administrador", slug: "super-admin" },
                        { name: "Administrador", slug: "admin" },
                        { name: "Mantenimiento", slug: "mantenimiento" },
                        { name: "Recepción", slug: "recepcion" },
                        { name: "Coach", slug: "coach" },
                        { name: "Limpieza", slug: "limpieza" },
                    ];
                    _i = 0, roles_1 = roles;
                    _c.label = 1;
                case 1:
                    if (!(_i < roles_1.length)) return [3 /*break*/, 4];
                    role = roles_1[_i];
                    return [4 /*yield*/, prisma.role.upsert({
                            where: { slug: role.slug },
                            update: {},
                            create: role,
                        })];
                case 2:
                    _c.sent();
                    _c.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("\u2705 ".concat(roles.length, " roles created"));
                    modules = [
                        {
                            name: "Usuarios",
                            slug: "usuarios",
                            description: "Gestión de empleados, roles y permisos del sistema",
                            icon: "Users",
                            path: "/dashboard/usuarios",
                            sortOrder: 1,
                        },
                        {
                            name: "Sucursales",
                            slug: "sucursales",
                            description: "Gestión de sedes y ubicaciones del gimnasio",
                            icon: "Building2",
                            path: "/dashboard/sucursales",
                            sortOrder: 2,
                        },
                    ];
                    _a = 0, modules_1 = modules;
                    _c.label = 5;
                case 5:
                    if (!(_a < modules_1.length)) return [3 /*break*/, 8];
                    mod = modules_1[_a];
                    return [4 /*yield*/, prisma.module.upsert({
                            where: { slug: mod.slug },
                            update: {},
                            create: mod,
                        })];
                case 6:
                    _c.sent();
                    _c.label = 7;
                case 7:
                    _a++;
                    return [3 /*break*/, 5];
                case 8:
                    console.log("\u2705 ".concat(modules.length, " modules created"));
                    return [4 /*yield*/, prisma.role.findUnique({
                            where: { slug: "super-admin" },
                        })];
                case 9:
                    adminRole = _c.sent();
                    if (!adminRole) {
                        throw new Error("Super Admin role not found. Roles must be seeded first.");
                    }
                    return [4 /*yield*/, bcryptjs_1.default.hash("admin123", 12)];
                case 10:
                    hashedPassword = _c.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: "admin@gym.com" },
                            update: {},
                            create: {
                                email: "admin@gym.com",
                                password: hashedPassword,
                                firstName: "Admin",
                                lastName: "Principal",
                                phone: null,
                                isActive: true,
                                roleId: adminRole.id,
                            },
                        })];
                case 11:
                    adminUser = _c.sent();
                    console.log("\u2705 Admin user created: ".concat(adminUser.email));
                    return [4 /*yield*/, prisma.module.findMany()];
                case 12:
                    allModules = _c.sent();
                    _b = 0, allModules_1 = allModules;
                    _c.label = 13;
                case 13:
                    if (!(_b < allModules_1.length)) return [3 /*break*/, 16];
                    mod = allModules_1[_b];
                    return [4 /*yield*/, prisma.userPermission.upsert({
                            where: {
                                userId_moduleId: {
                                    userId: adminUser.id,
                                    moduleId: mod.id,
                                },
                            },
                            update: {},
                            create: {
                                userId: adminUser.id,
                                moduleId: mod.id,
                                canCreate: true,
                                canRead: true,
                                canUpdate: true,
                                canDelete: true,
                            },
                        })];
                case 14:
                    _c.sent();
                    _c.label = 15;
                case 15:
                    _b++;
                    return [3 /*break*/, 13];
                case 16:
                    console.log("\u2705 Admin permissions assigned for ".concat(allModules.length, " modules"));
                    console.log("\n🎉 Seed completed successfully!");
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error("❌ Seed failed:", e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
