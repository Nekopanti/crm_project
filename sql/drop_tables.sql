SET FOREIGN_KEY_CHECKS = 0;

-- 删除所有表
DROP TABLE IF EXISTS
  `objects`,
  `page_layouts`,
  `page_lists`,
  `object_fields`,
  `page_layout_fields`,
  `page_list_fields`;

SET FOREIGN_KEY_CHECKS = 1;