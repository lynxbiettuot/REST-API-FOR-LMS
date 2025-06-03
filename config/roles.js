const roles = {
    Admin: ['course:create', 'course:read', 'course:update:any', 'course:delete:any', 'course:watch:video', 'course:edit:video', 'course:delete:video', 'user:create', 'user:read', 'user:update', 'user:delete', 'handle:request'],
    Instructor: ['course:create', 'course:read', 'course:update:own', 'course:delete:own', 'course:add:video', 'course:watch:video', 'course:edit:video', 'course:delete:video', 'update:profile:own'],
    Student: ['course:read', 'course:watch:video', 'update:profile:own', 'course:watch:video']
}

module.exports = roles;
