const userCollection = require('./user')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const sentRequests = require('./sentRequests');
// const receivedReqs = require("./receivedRequests");
const mongoose = require('mongoose')
// const oid = mongoose.Types.ObjectId
class UserModule {
    constructor() {}
    async signup(data) {
        console.log("model called");
        console.log("data", data)
        try {
            // Check if user already exists
            const existingUser = await userCollection.findOne({
                $or: [{ email: data.email }, { phone: data.phone }]
            });

            if (existingUser) {
                return {
                    success: true,
                    message: 'User already exists',
                };
            }

            // Encrypt password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);

            // Create new user
            const newUser = new userCollection({
                name: data.name,
                phone: data.phone,
                email: data.email,
                password: hashedPassword,
                joinedAt: new Date(),
                lastSeen: new Date(),
                active: true
            });

            // Save user to database
            await newUser.save();

            return {
                success: true,
                message: 'User registered successfully',
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    phone: newUser.phone
                }
            };

        } catch (error) {
            console.error('Signup error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error'
            };
        }
    }
    async login(data) {
        console.log("this one")
        try {
            // Find user by email
            const user = await userCollection.findOne({ email: data.email });
            console.log("user", user)
            // If user not found
            if (!user) {
                return {
                    success: false,
                    message: "User not found"
                };
            }

            // Compare password
            const isValidPassword = await bcrypt.compare(data.password, user.password);

            if (!isValidPassword) {
                return {
                    success: false,
                    message: "Invalid password"
                };
            }
            let token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET)
            // Return user data without password
            return {
                success: true,
                message: "Login successful",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    token: token
                }
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error'
            };
        }
    }
    async users(data){
        const users=await userCollection.find({name:{$regex:data.query.name.toString(),$options:"i"}},{"_id":1,"name":1}); //
        return users;
    }
    async returnUsersArray(data){
      //  console.log("data",data.body.members)
        const users=await userCollection.find(
            {_id:{$in:data}}, // Find users by IDs in the members array
            {"_id":1,"name":1,"email":1,"phone":1,"image":1} // Select only necessary fields
        ); //
        return users;
    }
}
module.exports = UserModule