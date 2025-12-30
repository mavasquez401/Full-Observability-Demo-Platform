-- Seed sample data for demo
-- Products
INSERT INTO products (id, name, description, price, stock) VALUES
  (1, 'Laptop Pro 15"', 'High-performance laptop with 16GB RAM', 1299.99, 50),
  (2, 'Wireless Mouse', 'Ergonomic wireless mouse with long battery life', 29.99, 200),
  (3, 'Mechanical Keyboard', 'RGB mechanical keyboard with cherry switches', 149.99, 75),
  (4, 'USB-C Hub', '7-in-1 USB-C hub with HDMI, USB, and SD card slots', 49.99, 150),
  (5, 'Monitor 27" 4K', '27-inch 4K UHD monitor with HDR support', 399.99, 30),
  (6, 'Webcam HD', '1080p HD webcam with auto-focus', 79.99, 100),
  (7, 'Standing Desk', 'Adjustable height standing desk', 599.99, 25),
  (8, 'Desk Chair', 'Ergonomic office chair with lumbar support', 299.99, 40)
ON CONFLICT DO NOTHING;

-- Reset sequence to avoid conflicts
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

