CREATE TABLE PAGE_LISTS (
    ID VARCHAR(32) PRIMARY KEY,
    NAME VARCHAR(255) NOT NULL,
	LABEL VARCHAR(255) NOT NULL,
    DELETED VARCHAR(1) NOT NULL DEFAULT '0'
);