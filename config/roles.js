const roles = {
    Admin: ['course:create', 'course:read', 'course:update:any', 'course:delete:any', 'user:create', 'user:read', 'user:update', 'user:delete'],
    Instructor: ['course:create', 'course:read', 'course:update:own', 'course:delete:own'],
    Student: ['course:read']
}

module.exports = roles;
