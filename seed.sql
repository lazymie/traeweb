-- ============================================
-- 暖窝 · 宠物领养平台 数据库导出
-- 导出时间: 2026/9/27 22:32:26
-- 来源数据库: file:./data/app.db
-- 导入 Turso 示例: turso db shell <数据库名> < seed.sql
-- ============================================

BEGIN TRANSACTION;

-- ---------- 建表语句 ----------
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nickname TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  avatar TEXT,
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE pets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  breed TEXT,
  age INTEGER,
  age_unit TEXT DEFAULT 'year',
  gender TEXT,
  health TEXT,
  vaccination TEXT,
  sterilized INTEGER DEFAULT 0,
  personality TEXT,
  description TEXT,
  location TEXT,
  images TEXT,
  publisher_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  review_note TEXT,
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (publisher_id) REFERENCES users(id)
);

CREATE INDEX idx_pets_status ON pets(status);

CREATE INDEX idx_pets_category ON pets(category);

CREATE INDEX idx_pets_publisher ON pets(publisher_id);

CREATE TABLE adoptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pet_id INTEGER NOT NULL,
  applicant_id INTEGER NOT NULL,
  reason TEXT,
  experience TEXT,
  contact TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  review_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (pet_id) REFERENCES pets(id),
  FOREIGN KEY (applicant_id) REFERENCES users(id)
);

CREATE INDEX idx_adoptions_pet ON adoptions(pet_id);

CREATE INDEX idx_adoptions_applicant ON adoptions(applicant_id);

CREATE INDEX idx_adoptions_status ON adoptions(status);

CREATE TABLE followups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  adoption_id INTEGER NOT NULL,
  content TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (adoption_id) REFERENCES adoptions(id)
);

CREATE TABLE announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  pinned INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  publisher_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (publisher_id) REFERENCES users(id)
);

CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pet_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  parent_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (pet_id) REFERENCES pets(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_comments_pet ON comments(pet_id);

CREATE TABLE favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  pet_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, pet_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (pet_id) REFERENCES pets(id)
);

-- ---------- 清空旧数据（保证可重复导入） ----------
DELETE FROM followups;
DELETE FROM adoptions;
DELETE FROM favorites;
DELETE FROM comments;
DELETE FROM announcements;
DELETE FROM pets;
DELETE FROM users;

-- ---------- 数据插入 ----------
INSERT INTO users ("id", "username", "password_hash", "nickname", "email", "phone", "role", "avatar", "bio", "status", "created_at") VALUES (1, 'admin', '$2a$10$fYQ7ULfY96ZEoNuNX/6MmusWW36uCG6tlxWuAwBzn/RFOOuVrJFKe', '平台管理员', 'admin@warmnest.cn', '13800000001', 'admin', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20animal%20shelter%20manager%20avatar%2C%20warm%20tones&image_size=square_hd', '暖窝平台运营管理员，致力于流浪动物救助事业。', 'active', '2026-09-27 06:20:08');
INSERT INTO users ("id", "username", "password_hash", "nickname", "email", "phone", "role", "avatar", "bio", "status", "created_at") VALUES (2, 'org1', '$2a$10$fedHkcMIkKu8Ngup9uiNBO6uHLorZAwxbhy09TxKvU8wBinw13ssC', '城市毛孩子救助中心', 'org1@warmnest.cn', '13800000002', 'org', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=animal%20rescue%20organization%20logo%20with%20paw%20icon%2C%20sage%20green&image_size=square_hd', '本地非营利流浪动物救助机构，已救助 200+ 只流浪毛孩子。', 'active', '2026-09-27 06:20:08');
INSERT INTO users ("id", "username", "password_hash", "nickname", "email", "phone", "role", "avatar", "bio", "status", "created_at") VALUES (3, 'user1', '$2a$10$dZ1qz6hPJLB1ny1Wm6P6zebwppCihHFwBf6kp2MNGvqTTtiRfk.6m', '小满', 'user1@warmnest.cn', '13800000003', 'user', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20young%20woman%20user%20avatar%2C%20soft%20pastel&image_size=square_hd', '猫奴一枚，家里有两只主子。希望再给一只流浪猫一个家。', 'active', '2026-09-27 06:20:08');

INSERT INTO pets ("id", "title", "category", "breed", "age", "age_unit", "gender", "health", "vaccination", "sterilized", "personality", "description", "location", "images", "publisher_id", "status", "review_note", "view_count", "favorite_count", "created_at", "updated_at") VALUES (1, '橘子', 'cat', '中华田园猫（橘猫）', 2, 'year', 'male', '健康，体内外已驱虫', '已完成猫三联+狂犬疫苗', 1, '亲人、爱撒娇、爱玩耍，喜欢被人摸下巴', '橘子是我在小区捡到的流浪猫，刚来时瘦骨嶙峋，现在已经胖成小猪了。橘子特别亲人，看到人就主动蹭腿，适合有耐心、有时间陪伴的家庭。希望你能给它一个永远的家。', '北京市朝阳区', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=orange%20tabby%20cat%20sitting%20on%20wooden%20floor%2C%20soft%20warm%20sunlight%2C%20professional%20pet%20photography&image_size=square","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=orange%20tabby%20cat%20closeup%20portrait%2C%20green%20eyes%2C%20fluffy%20fur&image_size=square"]', 2, 'available', NULL, 327, 28, '2026-09-27 06:20:08', '2026-09-27 06:20:08');
INSERT INTO pets ("id", "title", "category", "breed", "age", "age_unit", "gender", "health", "vaccination", "sterilized", "personality", "description", "location", "images", "publisher_id", "status", "review_note", "view_count", "favorite_count", "created_at", "updated_at") VALUES (2, '雪球', 'dog', '萨摩耶', 1, 'year', 'female', '健康，已绝育', '已完成犬七联+狂犬疫苗', 1, '活泼、爱笑、精力旺盛，需要每天遛弯', '雪球是被前主人弃养的萨摩耶，性格超好，对人非常热情，喜欢微笑。需要有一定养狗经验、能保证每天遛弯的家庭。', '上海市浦东新区', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=samoyed%20dog%20smiling%20in%20park%2C%20fluffy%20white%20fur%2C%20sunny%20day&image_size=square","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=samoyed%20dog%20portrait%20closeup%2C%20black%20smiling%20eyes&image_size=square"]', 2, 'available', NULL, 581, 67, '2026-09-27 06:20:08', '2026-09-27 06:20:08');
INSERT INTO pets ("id", "title", "category", "breed", "age", "age_unit", "gender", "health", "vaccination", "sterilized", "personality", "description", "location", "images", "publisher_id", "status", "review_note", "view_count", "favorite_count", "created_at", "updated_at") VALUES (3, '奶茶', 'cat', '英短蓝白', 8, 'month', 'female', '健康，体内外已驱虫', '已完成两针猫三联', 0, '安静、胆小但亲近人，适合安静家庭', '奶茶是救助站收留的小奶猫，妈妈是流浪猫。奶茶从小和妈妈在救助站长大，性格比一般小猫更胆小但更懂事。', '广州市天河区', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=british%20shorthair%20blue%20white%20kitten%20sitting%2C%20soft%20pastel%20background&image_size=square"]', 2, 'available', NULL, 146, 19, '2026-09-27 06:20:08', '2026-09-27 06:20:08');
INSERT INTO pets ("id", "title", "category", "breed", "age", "age_unit", "gender", "health", "vaccination", "sterilized", "personality", "description", "location", "images", "publisher_id", "status", "review_note", "view_count", "favorite_count", "created_at", "updated_at") VALUES (4, '旺财', 'dog', '中华田园犬', 3, 'year', 'male', '健康，已绝育', '已完成犬七联+狂犬疫苗', 1, '忠诚、警觉、聪明，看家好手', '旺财是工地流浪狗，被工人遗弃后我们接管。旺财非常聪明忠诚，对家人温顺，对外人警觉。希望找一个有院子的家庭或农场。', '成都市武侯区', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20rural%20dog%20brown%20medium%20size%20sitting%20on%20grass%2C%20alert%20expression&image_size=square"]', 2, 'available', NULL, 92, 11, '2026-09-27 06:20:08', '2026-09-27 06:20:08');
INSERT INTO pets ("id", "title", "category", "breed", "age", "age_unit", "gender", "health", "vaccination", "sterilized", "personality", "description", "location", "images", "publisher_id", "status", "review_note", "view_count", "favorite_count", "created_at", "updated_at") VALUES (5, '棉花糖', 'cat', '布偶猫', 2, 'year', 'female', '健康，已绝育', '已完成猫三联+狂犬疫苗', 1, '温顺、粘人、爱被抱', '棉花糖是主人出国无法继续饲养的布偶猫，性格超好，喜欢被人抱着。布偶猫需要定期梳毛，希望有耐心的领养人。', '深圳市南山区', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ragdoll%20cat%20with%20blue%20eyes%20fluffy%20white%20fur%20on%20soft%20blanket&image_size=square","https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ragdoll%20cat%20closeup%20face%2C%20deep%20blue%20eyes&image_size=square"]', 2, 'pending', NULL, 0, 0, '2026-09-27 06:20:08', '2026-09-27 06:20:08');
INSERT INTO pets ("id", "title", "category", "breed", "age", "age_unit", "gender", "health", "vaccination", "sterilized", "personality", "description", "location", "images", "publisher_id", "status", "review_note", "view_count", "favorite_count", "created_at", "updated_at") VALUES (6, '豆豆', 'other', '荷兰侏儒兔', 1, 'year', 'male', '健康', '兔瘟疫苗已接种', 1, '活泼、好奇、爱啃东西', '豆豆是被遗弃的荷兰侏儒兔，体型小巧。需要宽敞的笼子和每日放风时间。希望有养兔经验的家庭。', '杭州市西湖区', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=small%20holland%20lop%20rabbit%20on%20grass%2C%20fluffy%20grey%20white%20fur&image_size=square"]', 2, 'available', NULL, 64, 8, '2026-09-27 06:20:08', '2026-09-27 06:20:08');
INSERT INTO pets ("id", "title", "category", "breed", "age", "age_unit", "gender", "health", "vaccination", "sterilized", "personality", "description", "location", "images", "publisher_id", "status", "review_note", "view_count", "favorite_count", "created_at", "updated_at") VALUES (7, '黑豆', 'dog', '拉布拉多', 4, 'month', 'male', '健康，已驱虫', '已完成两针犬七联', 0, '贪吃、爱玩、精力旺盛', '黑豆是救助站接生的拉布拉多幼犬，妈妈是救助的流浪狗。黑豆兄弟姐妹都已经找到家，只剩它还在等待。', '南京市鼓楼区', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=labrador%20puppy%20black%20fur%20playing%20on%20grass%2C%20sunny%20day&image_size=square"]', 2, 'available', NULL, 210, 31, '2026-09-27 06:20:08', '2026-09-27 06:20:08');
INSERT INTO pets ("id", "title", "category", "breed", "age", "age_unit", "gender", "health", "vaccination", "sterilized", "personality", "description", "location", "images", "publisher_id", "status", "review_note", "view_count", "favorite_count", "created_at", "updated_at") VALUES (8, '阿白', 'cat', '中华田园猫（白猫）', 5, 'year', 'female', '健康，已绝育', '已完成猫三联+狂犬疫苗', 1, '高冷、独立、偶尔撒娇', '阿白是楼下喂了 3 年的流浪猫，最近终于愿意进家门了。阿白性格独立，不太喜欢被抱，但喜欢在旁边看着你。适合低强度陪伴的家庭。', '武汉市江汉区', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=white%20short%20hair%20cat%20sitting%20by%20window%2C%20sunlight%2C%20dignified%20expression&image_size=square"]', 3, 'available', NULL, 178, 22, '2026-09-27 06:20:08', '2026-09-27 06:20:08');

INSERT INTO announcements ("id", "title", "content", "excerpt", "pinned", "status", "publisher_id", "created_at") VALUES (1, '暖窝平台正式上线公告', '各位关心流浪动物救助的朋友们，大家好！

暖窝 · 宠物领养平台经过半年筹备，今日正式上线。我们将致力于整合全国救助机构与领养者的信息，让每一个流浪毛孩子都能更快找到温暖的家。

平台首期开放：宠物信息发布、领养申请、收藏留言、后台审核等功能。后续会陆续上线通知提醒、领养回访记录、第三方登录等功能。

让我们一起，用「领养代替购买」，给流浪的毛孩子一个家。', '经过半年筹备，暖窝平台今日正式上线。让我们一起，用「领养代替购买」。', 1, 'published', 1, '2026-09-27 06:20:08');
INSERT INTO announcements ("id", "title", "content", "excerpt", "pinned", "status", "publisher_id", "created_at") VALUES (2, '领养须知：领养前请仔细阅读', '在提交领养申请前，请认真阅读以下须知：

1. 领养是长期承诺，宠物寿命可达 10-20 年，请确认你有足够的时间、精力和经济能力照顾它一辈子。

2. 领养需通过平台线上申请，经过发布者或管理员审核后才能完成。

3. 领养前请充分了解所领养品种的特点和需求（运动量、掉毛、性格等）。

4. 平台提倡领养后定期带宠物体检、按时免疫、必要时绝育。

5. 领养后请定期回访，反馈宠物近况，便于平台追踪领养效果。', '领养是长期承诺，请确认有能力照顾宠物一辈子再申请。', 1, 'published', 1, '2026-09-27 06:20:08');
INSERT INTO announcements ("id", "title", "content", "excerpt", "pinned", "status", "publisher_id", "created_at") VALUES (3, '冬季流浪动物救助倡议书', '冬天来了，流浪动物的生存面临严峻挑战。

如果您在小区、街边遇到流浪猫狗，可以：
- 提供一些温水和食物
- 在避风处放置纸箱+旧衣物做简易窝
- 联系本地救助机构
- 不要驱赶、伤害

如果您愿意领养或临时寄养，请联系平台合作机构。让这个冬天，少一些冻僵的小生命。', '冬季流浪动物生存艰难，您的微小善举可能拯救一条生命。', 0, 'published', 1, '2026-09-27 06:20:08');

INSERT INTO comments ("id", "pet_id", "user_id", "content", "parent_id", "created_at") VALUES (1, 1, 3, '橘子好可爱！请问它和家里其他猫能相处吗？', NULL, '2026-09-27 06:20:08');
INSERT INTO comments ("id", "pet_id", "user_id", "content", "parent_id", "created_at") VALUES (2, 1, 2, '橘子性格温和，应该可以和脾气温和的猫相处，建议慢慢引入。', 1, '2026-09-27 06:20:08');
INSERT INTO comments ("id", "pet_id", "user_id", "content", "parent_id", "created_at") VALUES (3, 2, 3, '萨摩耶需要每天遛多久？', NULL, '2026-09-27 06:20:08');
INSERT INTO comments ("id", "pet_id", "user_id", "content", "parent_id", "created_at") VALUES (4, 2, 2, '建议每天 1-2 小时，分早晚两次遛。', 3, '2026-09-27 06:20:08');
INSERT INTO comments ("id", "pet_id", "user_id", "content", "parent_id", "created_at") VALUES (5, 7, 3, '黑豆还在吗？想领养。', NULL, '2026-09-27 06:20:08');
INSERT INTO comments ("id", "pet_id", "user_id", "content", "parent_id", "created_at") VALUES (6, 3, 3, '部署验证评论', NULL, '2026-09-27 11:31:00');

INSERT INTO favorites ("id", "user_id", "pet_id", "created_at") VALUES (1, 3, 1, '2026-09-27 06:20:08');
INSERT INTO favorites ("id", "user_id", "pet_id", "created_at") VALUES (3, 3, 7, '2026-09-27 06:20:08');

INSERT INTO adoptions ("id", "pet_id", "applicant_id", "reason", "experience", "contact", "status", "review_note", "created_at", "updated_at") VALUES (1, 3, 3, '家里没有其他宠物，有时间陪伴小猫长大', '之前养过一只田园猫 12 年', '微信 xiaoman_cat', 'pending', NULL, '2026-09-27 06:20:08', '2026-09-27 06:20:08');
INSERT INTO adoptions ("id", "pet_id", "applicant_id", "reason", "experience", "contact", "status", "review_note", "created_at", "updated_at") VALUES (2, 7, 3, '有院子，希望给拉布拉多足够的活动空间', '家里养过金毛 8 年', '电话 13800000003', 'approved', NULL, '2026-09-27 06:20:08', '2026-09-27 06:20:08');
INSERT INTO adoptions ("id", "pet_id", "applicant_id", "reason", "experience", "contact", "status", "review_note", "created_at", "updated_at") VALUES (3, 1, 3, '部署功能验证', '有养宠经验', '13800000003', 'pending', NULL, '2026-09-27 11:31:00', '2026-09-27 11:31:00');

-- ---------- 自增计数器同步 ----------
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence (name, seq) VALUES ('users', 3);
INSERT INTO sqlite_sequence (name, seq) VALUES ('pets', 8);
INSERT INTO sqlite_sequence (name, seq) VALUES ('announcements', 3);
INSERT INTO sqlite_sequence (name, seq) VALUES ('comments', 6);
INSERT INTO sqlite_sequence (name, seq) VALUES ('favorites', 4);
INSERT INTO sqlite_sequence (name, seq) VALUES ('adoptions', 3);

COMMIT;
