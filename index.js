import express from "express";
import pg from "pg";
import session from "express-session";

const app = express();
const port = 3001;

// Connect to PostgreSQL database
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "BlogDB",
  password: "root", 
  port: 5432,
});
db.connect();

// Middleware settings
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Enable sessions to remember logged in user
app.use(
  session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: false,
  })
);

// Make logged in user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.error = req.session.error || null;
  req.session.error = null;
  next();
});

// HOME PAGE - SHOW ALL BLOG POSTS
app.get("/", async (req, res) => {
  try {
    // Get all blogs from the database
    const result = await db.query("SELECT * FROM blogs ORDER BY blog_id DESC");
    const posts = result.rows;
    res.render("index", { posts: posts });
  } catch (err) {
    console.log(err);
    res.send("Database error");
  }
});

// SIGNUP PAGE - SHOW FORM
app.get("/signup", (req, res) => {
  res.render("signup");
});

// SIGNUP FORM - SUBMIT
app.post("/signup", async (req, res) => {
  const user_id = req.body.user_id;
  const password = req.body.password;
  const name = req.body.name;

  try {
    // Check if user_id is already in the database
    const checkUser = await db.query("SELECT * FROM users WHERE user_id = $1", [
      user_id,
    ]);

    if (checkUser.rows.length > 0) {
      req.session.error = "User ID already taken! Try another one.";
      return res.redirect("/signup");
    }

    // Insert new user into database
    await db.query(
      "INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)",
      [user_id, password, name]
    );

    // Redirect to signin page
    res.redirect("/signin");
  } catch (err) {
    console.log(err);
    res.send("Error signing up");
  }
});

// SIGNIN PAGE - SHOW FORM
app.get("/signin", (req, res) => {
  res.render("signin");
});

// SIGNIN FORM - SUBMIT
app.post("/signin", async (req, res) => {
  const user_id = req.body.user_id;
  const password = req.body.password;

  try {
    // Check if user_id and password match
    const result = await db.query(
      "SELECT * FROM users WHERE user_id = $1 AND password = $2",
      [user_id, password]
    );

    if (result.rows.length === 0) {
      req.session.error = "Wrong User ID or Password!";
      return res.redirect("/signin");
    }

    // Save logged in user info in session
    const loggedInUser = result.rows[0];
    req.session.user = {
      user_id: loggedInUser.user_id,
      name: loggedInUser.name,
    };

    // Go back to home page
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.send("Error signing in");
  }
});

// SIGNOUT
app.get("/signout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// CREATE A NEW POST
app.post("/posts", async (req, res) => {
  // If not logged in, go to sign in
  if (!req.session.user) {
    return res.redirect("/signin");
  }

  const title = req.body.title;
  const content = req.body.content;
  const creator_user_id = req.session.user.user_id;
  const creator_name = req.session.user.name;

  try {
    // Save new post to database
    await db.query(
      "INSERT INTO blogs (creator_name, creator_user_id, title, body) VALUES ($1, $2, $3, $4)",
      [creator_name, creator_user_id, title, content]
    );
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.send("Error creating post");
  }
});

// EDIT PAGE - SHOW EDIT FORM
app.get("/posts/:id/edit", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/signin");
  }

  const blog_id = req.params.id;

  try {
    const result = await db.query("SELECT * FROM blogs WHERE blog_id = $1", [
      blog_id,
    ]);

    if (result.rows.length === 0) {
      return res.redirect("/");
    }

    const post = result.rows[0];

    // Only allow owner to edit
    if (post.creator_user_id !== req.session.user.user_id) {
      return res.redirect("/");
    }

    res.render("edit", { post: post });
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});

// UPDATE POST - SUBMIT EDIT FORM
app.post("/posts/:id/update", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/signin");
  }

  const blog_id = req.params.id;
  const title = req.body.title;
  const content = req.body.content;

  try {
    // Update post in database if user matches
    await db.query(
      "UPDATE blogs SET title = $1, body = $2 WHERE blog_id = $3 AND creator_user_id = $4",
      [title, content, blog_id, req.session.user.user_id]
    );
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.send("Error updating post");
  }
});

// DELETE POST
app.post("/posts/:id/delete", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/signin");
  }

  const blog_id = req.params.id;

  try {
    // Delete post from database if user matches
    await db.query(
      "DELETE FROM blogs WHERE blog_id = $1 AND creator_user_id = $2",
      [blog_id, req.session.user.user_id]
    );
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.send("Error deleting post");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});