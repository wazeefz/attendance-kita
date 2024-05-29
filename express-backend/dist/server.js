"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const body_parser_1 = __importDefault(require("body-parser"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app = (0, express_1.default)();
const port = 3000;
const secretKey = "your_secret_key";
// Middleware
app.use(body_parser_1.default.json());
// MongoDB connection
mongoose_1.default.connect("mongodb://localhost:27017/attendance").then(() => {
    console.log("MongoDB connected successfully");
}, (err) => {
    console.error("MongoDB connection error:", err);
});
const userSchema = new mongoose_1.default.Schema({
    username: { type: String, unique: true },
    password: String,
});
const User = mongoose_1.default.model("User", userSchema);
const attendanceSchema = new mongoose_1.default.Schema({
    userId: mongoose_1.default.Schema.Types.ObjectId,
    time: String,
    location: {
        latitude: Number,
        longitude: Number,
    },
});
const Attendance = mongoose_1.default.model("Attendance", attendanceSchema);
// Signup route
app.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    try {
        yield newUser.save();
        res.status(201).send("User created");
    }
    catch (error) {
        res.status(500).send("Error creating user");
    }
}));
// Login route
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const user = yield User.findOne({ username });
    if (!user || !(yield bcryptjs_1.default.compare(password, user.password))) {
        return res.status(401).send("Invalid credentials");
    }
    const token = jsonwebtoken_1.default.sign({ userId: user._id }, secretKey);
    res.json({ token });
}));
// Middleware to authenticate requests
const authenticate = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) {
        return res.status(401).send("Access denied");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secretKey);
        req.user = decoded; // Now TypeScript will recognize this
        next();
    }
    catch (error) {
        res.status(400).send("Invalid token");
    }
};
// Attendance route
app.post("/attendance", authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { time, location } = req.body;
    const newAttendance = new Attendance({
        userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId, // Optional chaining in case user is undefined
        time,
        location,
    });
    try {
        yield newAttendance.save();
        res.status(201).send("Attendance recorded");
    }
    catch (error) {
        res.status(500).send("Error recording attendance");
    }
}));
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
