-- Create users table
CREATE TABLE users (
    user_id VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255),
    name VARCHAR(255)
);

-- Create blogs table
CREATE TABLE blogs (
    blog_id SERIAL PRIMARY KEY,
    creator_name VARCHAR(255),
    creator_user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255),
    body TEXT,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert 3 initial users
INSERT INTO users (user_id, password, name) VALUES
('jasper123', 'pass123', 'Jasper'),
('Example', 'pass456', 'Example'),
('Example2', 'pass789', 'Example2');

-- Insert 5 initial blog entries
INSERT INTO blogs (creator_name, creator_user_id, title, body) VALUES
('Jasper', 'jasper123', 'My First Blog', 'Hello world! This is my first blog post.'),
('Example', 'Example', 'Learning Node.js', 'Node.js helps us run JavaScript on the backend.'),
('Example2', 'Example2', 'PostgreSQL Basics', 'Databases help store our app data permanently.'),
('Jasper', 'jasper123', 'Express Framework', 'Express makes it easy to handle web routes.'),
('Example', 'Example', 'EJS Templates', 'EJS helps render HTML pages with real database data.');