DROP TABLE IF EXISTS request_capture;

CREATE TABLE request_capture
(
    webhook_id UUID NOT NULL,
    url TEXT,
    method CHAR(10),
    body LONGTEXT,
    cookies LONGTEXT,
    headers LONGTEXT,
    creation_date DATE
);
