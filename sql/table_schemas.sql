CREATE TABLE IF NOT EXISTS request_info
(
    webhook_id UUID NOT NULL,
    url TEXT,
    method CHAR(10),
    body LONGTEXT,
    cookies LONGTEXT,
    headers LONGTEXT
);
