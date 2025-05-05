const roles = {
    Admin: ['course:create', 'course:read', 'course:update:any', 'course:delete:any', 'user:create', 'user:read', 'user:update', 'user:delete'],
    Instructor: ['course:create', 'course:read', 'course:update:own', 'course:delete:own', 'update:profile:own'],
    Student: ['course:read', 'update:profile:own']
}

module.exports = roles;
