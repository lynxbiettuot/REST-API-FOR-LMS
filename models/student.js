const mongoose = require('mongoose');

const { Schema } = mongoose;

const studentSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        require: true
    },
    avatarUrl: {
        type: String,
    },
    course: [{
        type: mongoose.Types.ObjectId,
        ref: 'Course',
        required: true
    }],
    cart: {
        items: [
            {
                courseId: { type: Schema.Types.ObjectId, ref: 'Course' }
            }
        ]
    }
})

studentSchema.methods.addToCart = function (course) {
    const cartCourseIndex = this.cart.items.findIndex(singleCourse => {
        return singleCourse.courseId.toString() === course._id.toString();
    })
    const updateCartItems = [...this.cart.items];
    if (cartCourseIndex < 0) {
        updateCartItems.push({ courseId: course._id });
    } else {
        return undefined;
    }
    const updateCart = {
        items: updateCartItems
    };
    this.cart = updateCart
    return this.save();
}

studentSchema.methods.removeFromCart = function (currentCourseId) {
    const updateCartItems = this.cart.items.filter(singleCourse => {
        return singleCourse.courseId.toString() !== currentCourseId.toString();
    });
    this.cart.items = updateCartItems;
    return this.save();
}

studentSchema.methods.clearCart = function () {
    this.cart = { items: [] };
    return this.save();
}

module.exports = mongoose.model('Student', studentSchema);