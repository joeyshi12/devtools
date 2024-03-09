DROP TABLE IF EXISTS webhook_history;
DROP TABLE IF EXISTS request_capture;

CREATE TABLE webhook_history
(
	id CHAR(36) PRIMARY KEY,
	creation_date DATE
);

CREATE TABLE request_capture
(
    webhook_id CHAR(36) NOT NULL,
    url TEXT,
    method CHAR(10),
    body LONGTEXT,
    headers LONGTEXT,
    creation_date DATE,
    FOREIGN KEY (webhook_id) REFERENCES webhook_history(id) ON DELETE CASCADE
);
