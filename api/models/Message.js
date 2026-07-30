const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    phone: {
        type: String,
        maxlength: [20, 'Phone number cannot be longer than 20 characters']
    },
    company: {
        type: String,
        maxlength: [100, 'Company name cannot be longer than 100 characters']
    },
    businessName: {
        type: String,
        maxlength: [150, 'Business name cannot be longer than 150 characters']
    },
    businessLink: {
        type: String,
        maxlength: [300, 'Business link cannot be longer than 300 characters']
    },
    message: {
        type: String,
        required: [true, 'Please add a message'],
        maxlength: [5000, 'Message cannot be more than 5000 characters']
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
