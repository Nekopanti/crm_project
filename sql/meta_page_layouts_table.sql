CREATE TABLE PAGE_LAYOUT_FIELDS (
    ID VARCHAR(32) PRIMARY KEY,
    NAME VARCHAR(255) NOT NULL,
    PAGE_LIST_ID VARCHAR(255) NOT NULL,
    DELETED VARCHAR(1) NOT NULL DEFAULT '0',
    FOREIGN KEY (PAGE_LIST_ID) REFERENCES PAGE_LISTS(ID)
);			