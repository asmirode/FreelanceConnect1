import mongoose from 'mongoose';
const { Schema } = mongoose;

const skillSchema = new Schema({
  domain: {
    type: String,
    required: true,
    index: true
  },
  subdomains: {
    type: [String],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length > 0;
      },
      message: 'At least one subdomain is required'
    }
  },
  description: {
    type: String,
    required: false
  },
  icon: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model("Skill", skillSchema);
