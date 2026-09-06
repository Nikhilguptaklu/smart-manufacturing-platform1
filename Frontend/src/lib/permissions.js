export const ROLE_LABELS = {
    admin: 'Administrator',
    manager: 'Manager',
    engineer: 'Engineer',
    employee: 'Employee',
    customer: 'Customer',
};
export const ROLE_COLORS = {
    admin: 'bg-red-100 text-red-700 border-red-200',
    manager: 'bg-blue-100 text-blue-700 border-blue-200',
    engineer: 'bg-teal-100 text-teal-700 border-teal-200',
    employee: 'bg-gray-100 text-gray-700 border-gray-200',
    customer: 'bg-amber-100 text-amber-700 border-amber-200',
};
const PERMISSIONS = {
    admin: ['dashboard', 'erp', 'inventory', 'production', 'plm', 'crm', 'reports', 'users', 'settings'],
    manager: ['dashboard', 'erp', 'inventory', 'production', 'plm', 'crm', 'reports', 'settings'],
    engineer: ['dashboard', 'production', 'plm', 'reports'],
    employee: ['dashboard', 'inventory', 'production', 'erp'],
    customer: ['customer'],
};
export function canAccess(role, module) {
    if (!role)
        return false;
    return PERMISSIONS[role]?.includes(module) ?? false;
}
export function canWrite(role, area) {
    if (!role)
        return false;
    const writePermissions = {
        admin: ['products', 'inventory', 'customers', 'suppliers', 'orders', 'production', 'components', 'boms', 'product_versions', 'users', 'settings'],
        manager: ['products', 'inventory', 'customers', 'suppliers', 'orders', 'production'],
        engineer: ['components', 'boms', 'product_versions'],
        employee: [],
        customer: [],
    };
    return writePermissions[role]?.includes(area) ?? false;
}
