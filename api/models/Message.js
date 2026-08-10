const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'Please add a valid email address'
        ]
    },
    phone: {
        type: String,
        maxlength: [50, 'Phone number cannot be longer than 50 characters']
    },
    company: {
        type: String,
        maxlength: [250, 'Company name cannot be longer than 250 characters']
    },
    businessName: {
        type: String,
        maxlength: [250, 'Business name cannot be longer than 250 characters']
    },
    businessLink: {
        type: String,
        maxlength: [2000, 'Business link cannot be longer than 2000 characters']
    },
    message: {
        type: String,
        required: [true, 'Please add a message'],
        maxlength: [10000, 'Message cannot be more than 10000 characters']
    },
    attachment: {
        type: String
    },
    appointmentDate: {
        type: String
    },
    appointmentTime: {
        type: String
    },
    meetingType: {
        type: String
    },
    notes: {
        type: String
    },
    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'archived'],
        default: 'new'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', MessageSchema);
