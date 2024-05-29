import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
const port = 3000;
const secretKey = "your_secret_key";

// Middleware
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/attendance").then(
	() => {
		console.log("MongoDB connected successfully");
	},
	(err) => {
		console.error("MongoDB connection error:", err);
	}
);

// User schema
interface IUser extends mongoose.Document {
	username: string;
	password: string;
}

const userSchema = new mongoose.Schema({
	username: { type: String, unique: true },
	password: String,
});

const User = mongoose.model<IUser>("User", userSchema);

// Attendance schema
interface IAttendance extends mongoose.Document {
	userId: mongoose.Schema.Types.ObjectId;
	time: string;
	location: {
		latitude: number;
		longitude: number;
	};
}

const attendanceSchema = new mongoose.Schema({
	userId: mongoose.Schema.Types.ObjectId,
	time: String,
	location: {
		latitude: Number,
		longitude: Number,
	},
});

const Attendance = mongoose.model<IAttendance>("Attendance", attendanceSchema);

// Signup route
app.post("/signup", async (req: Request, res: Response) => {
	const { username, password } = req.body;
	const hashedPassword = await bcrypt.hash(password, 10);

	const newUser = new User({ username, password: hashedPassword });

	try {
		await newUser.save();
		res.status(201).send("User created");
	} catch (error) {
		res.status(500).send("Error creating user");
	}
});

// Login route
app.post("/login", async (req: Request, res: Response) => {
	const { username, password } = req.body;
	const user = await User.findOne({ username });

	if (!user || !(await bcrypt.compare(password, user.password))) {
		return res.status(401).send("Invalid credentials");
	}

	const token = jwt.sign({ userId: user._id }, secretKey);
	res.json({ token });
});

// Middleware to authenticate requests
const authenticate = (req: Request, res: Response, next: NextFunction) => {
	const token = req.headers["authorization"];

	if (!token) {
		return res.status(401).send("Access denied");
	}

	try {
		const decoded = jwt.verify(token, secretKey) as { userId: string };
		req.user = decoded; // Now TypeScript will recognize this
		next();
	} catch (error) {
		res.status(400).send("Invalid token");
	}
};

// Attendance route
app.post("/attendance", authenticate, async (req: Request, res: Response) => {
	const { time, location } = req.body;

	const newAttendance = new Attendance({
		userId: req.user?.userId, // Optional chaining in case user is undefined
		time,
		location,
	});

	try {
		await newAttendance.save();
		res.status(201).send("Attendance recorded");
	} catch (error) {
		res.status(500).send("Error recording attendance");
	}
});

app.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
});
