import bcrypt from 'bcryptjs';
import { run } from './index.js';

const img = (prompt: string, size = 'square') =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;

const avatar = (prompt: string) => img(prompt, 'square_hd');

export async function seed(): Promise<void> {
  console.log('[db] Seeding initial data...');

  // 用户
  const adminHash = bcrypt.hashSync('admin123', 10);
  const orgHash = bcrypt.hashSync('org123', 10);
  const userHash = bcrypt.hashSync('user123', 10);

  const users = [
    { username: 'admin', hash: adminHash, nickname: '平台管理员', email: 'admin@warmnest.cn', phone: '13800000001', role: 'admin', avatar: avatar('friendly animal shelter manager avatar, warm tones'), bio: '暖窝平台运营管理员，致力于流浪动物救助事业。' },
    { username: 'org1', hash: orgHash, nickname: '城市毛孩子救助中心', email: 'org1@warmnest.cn', phone: '13800000002', role: 'org', avatar: avatar('animal rescue organization logo with paw icon, sage green'), bio: '本地非营利流浪动物救助机构，已救助 200+ 只流浪毛孩子。' },
    { username: 'user1', hash: userHash, nickname: '小满', email: 'user1@warmnest.cn', phone: '13800000003', role: 'user', avatar: avatar('friendly young woman user avatar, soft pastel'), bio: '猫奴一枚，家里有两只主子。希望再给一只流浪猫一个家。' },
  ];

  const userIds: number[] = [];
  for (const u of users) {
    const r = await run(
      `INSERT INTO users (username, password_hash, nickname, email, phone, role, avatar, bio, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [u.username, u.hash, u.nickname, u.email, u.phone, u.role, u.avatar, u.bio]
    );
    userIds.push(r.lastId);
  }
  const [adminId, orgId, userId] = userIds;

  // 宠物
  const pets = [
    {
      title: '橘子', category: 'cat', breed: '中华田园猫（橘猫）', age: 2, ageUnit: 'year', gender: 'male',
      health: '健康，体内外已驱虫', vaccination: '已完成猫三联+狂犬疫苗', sterilized: 1,
      personality: '亲人、爱撒娇、爱玩耍，喜欢被人摸下巴',
      description: '橘子是我在小区捡到的流浪猫，刚来时瘦骨嶙峋，现在已经胖成小猪了。橘子特别亲人，看到人就主动蹭腿，适合有耐心、有时间陪伴的家庭。希望你能给它一个永远的家。',
      location: '北京市朝阳区', images: [img('orange tabby cat sitting on wooden floor, soft warm sunlight, professional pet photography'),
        img('orange tabby cat closeup portrait, green eyes, fluffy fur')],
      publisherId: orgId, status: 'available', viewCount: 320, favoriteCount: 28,
    },
    {
      title: '雪球', category: 'dog', breed: '萨摩耶', age: 1, ageUnit: 'year', gender: 'female',
      health: '健康，已绝育', vaccination: '已完成犬七联+狂犬疫苗', sterilized: 1,
      personality: '活泼、爱笑、精力旺盛，需要每天遛弯',
      description: '雪球是被前主人弃养的萨摩耶，性格超好，对人非常热情，喜欢微笑。需要有一定养狗经验、能保证每天遛弯的家庭。',
      location: '上海市浦东新区', images: [img('samoyed dog smiling in park, fluffy white fur, sunny day'),
        img('samoyed dog portrait closeup, black smiling eyes')],
      publisherId: orgId, status: 'available', viewCount: 580, favoriteCount: 67,
    },
    {
      title: '奶茶', category: 'cat', breed: '英短蓝白', age: 8, ageUnit: 'month', gender: 'female',
      health: '健康，体内外已驱虫', vaccination: '已完成两针猫三联', sterilized: 0,
      personality: '安静、胆小但亲近人，适合安静家庭',
      description: '奶茶是救助站收留的小奶猫，妈妈是流浪猫。奶茶从小和妈妈在救助站长大，性格比一般小猫更胆小但更懂事。',
      location: '广州市天河区', images: [img('british shorthair blue white kitten sitting, soft pastel background')],
      publisherId: orgId, status: 'available', viewCount: 145, favoriteCount: 19,
    },
    {
      title: '旺财', category: 'dog', breed: '中华田园犬', age: 3, ageUnit: 'year', gender: 'male',
      health: '健康，已绝育', vaccination: '已完成犬七联+狂犬疫苗', sterilized: 1,
      personality: '忠诚、警觉、聪明，看家好手',
      description: '旺财是工地流浪狗，被工人遗弃后我们接管。旺财非常聪明忠诚，对家人温顺，对外人警觉。希望找一个有院子的家庭或农场。',
      location: '成都市武侯区', images: [img('chinese rural dog brown medium size sitting on grass, alert expression')],
      publisherId: orgId, status: 'available', viewCount: 92, favoriteCount: 11,
    },
    {
      title: '棉花糖', category: 'cat', breed: '布偶猫', age: 2, ageUnit: 'year', gender: 'female',
      health: '健康，已绝育', vaccination: '已完成猫三联+狂犬疫苗', sterilized: 1,
      personality: '温顺、粘人、爱被抱',
      description: '棉花糖是主人出国无法继续饲养的布偶猫，性格超好，喜欢被人抱着。布偶猫需要定期梳毛，希望有耐心的领养人。',
      location: '深圳市南山区', images: [img('ragdoll cat with blue eyes fluffy white fur on soft blanket'),
        img('ragdoll cat closeup face, deep blue eyes')],
      publisherId: orgId, status: 'pending', viewCount: 0, favoriteCount: 0,
    },
    {
      title: '豆豆', category: 'other', breed: '荷兰侏儒兔', age: 1, ageUnit: 'year', gender: 'male',
      health: '健康', vaccination: '兔瘟疫苗已接种', sterilized: 1,
      personality: '活泼、好奇、爱啃东西',
      description: '豆豆是被遗弃的荷兰侏儒兔，体型小巧。需要宽敞的笼子和每日放风时间。希望有养兔经验的家庭。',
      location: '杭州市西湖区', images: [img('small holland lop rabbit on grass, fluffy grey white fur')],
      publisherId: orgId, status: 'available', viewCount: 64, favoriteCount: 8,
    },
    {
      title: '黑豆', category: 'dog', breed: '拉布拉多', age: 4, ageUnit: 'month', gender: 'male',
      health: '健康，已驱虫', vaccination: '已完成两针犬七联', sterilized: 0,
      personality: '贪吃、爱玩、精力旺盛',
      description: '黑豆是救助站接生的拉布拉多幼犬，妈妈是救助的流浪狗。黑豆兄弟姐妹都已经找到家，只剩它还在等待。',
      location: '南京市鼓楼区', images: [img('labrador puppy black fur playing on grass, sunny day')],
      publisherId: orgId, status: 'available', viewCount: 210, favoriteCount: 31,
    },
    {
      title: '阿白', category: 'cat', breed: '中华田园猫（白猫）', age: 5, ageUnit: 'year', gender: 'female',
      health: '健康，已绝育', vaccination: '已完成猫三联+狂犬疫苗', sterilized: 1,
      personality: '高冷、独立、偶尔撒娇',
      description: '阿白是楼下喂了 3 年的流浪猫，最近终于愿意进家门了。阿白性格独立，不太喜欢被抱，但喜欢在旁边看着你。适合低强度陪伴的家庭。',
      location: '武汉市江汉区', images: [img('white short hair cat sitting by window, sunlight, dignified expression')],
      publisherId: userId, status: 'available', viewCount: 178, favoriteCount: 22,
    },
  ];

  const petIds: number[] = [];
  for (const p of pets) {
    const r = await run(
      `INSERT INTO pets (title, category, breed, age, age_unit, gender, health, vaccination, sterilized, personality, description, location, images, publisher_id, status, view_count, favorite_count) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.title, p.category, p.breed, p.age, p.ageUnit, p.gender, p.health, p.vaccination, p.sterilized, p.personality, p.description, p.location, JSON.stringify(p.images), p.publisherId, p.status, p.viewCount, p.favoriteCount]
    );
    petIds.push(r.lastId);
  }

  // 公告
  const announcements = [
    {
      title: '暖窝平台正式上线公告',
      content: '各位关心流浪动物救助的朋友们，大家好！\n\n暖窝 · 宠物领养平台经过半年筹备，今日正式上线。我们将致力于整合全国救助机构与领养者的信息，让每一个流浪毛孩子都能更快找到温暖的家。\n\n平台首期开放：宠物信息发布、领养申请、收藏留言、后台审核等功能。后续会陆续上线通知提醒、领养回访记录、第三方登录等功能。\n\n让我们一起，用「领养代替购买」，给流浪的毛孩子一个家。',
      excerpt: '经过半年筹备，暖窝平台今日正式上线。让我们一起，用「领养代替购买」。',
      pinned: 1, status: 'published', publisherId: adminId,
    },
    {
      title: '领养须知：领养前请仔细阅读',
      content: '在提交领养申请前，请认真阅读以下须知：\n\n1. 领养是长期承诺，宠物寿命可达 10-20 年，请确认你有足够的时间、精力和经济能力照顾它一辈子。\n\n2. 领养需通过平台线上申请，经过发布者或管理员审核后才能完成。\n\n3. 领养前请充分了解所领养品种的特点和需求（运动量、掉毛、性格等）。\n\n4. 平台提倡领养后定期带宠物体检、按时免疫、必要时绝育。\n\n5. 领养后请定期回访，反馈宠物近况，便于平台追踪领养效果。',
      excerpt: '领养是长期承诺，请确认有能力照顾宠物一辈子再申请。',
      pinned: 1, status: 'published', publisherId: adminId,
    },
    {
      title: '冬季流浪动物救助倡议书',
      content: '冬天来了，流浪动物的生存面临严峻挑战。\n\n如果您在小区、街边遇到流浪猫狗，可以：\n- 提供一些温水和食物\n- 在避风处放置纸箱+旧衣物做简易窝\n- 联系本地救助机构\n- 不要驱赶、伤害\n\n如果您愿意领养或临时寄养，请联系平台合作机构。让这个冬天，少一些冻僵的小生命。',
      excerpt: '冬季流浪动物生存艰难，您的微小善举可能拯救一条生命。',
      pinned: 0, status: 'published', publisherId: adminId,
    },
  ];

  for (const a of announcements) {
    await run(
      `INSERT INTO announcements (title, content, excerpt, pinned, status, publisher_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [a.title, a.content, a.excerpt, a.pinned, a.status, a.publisherId]
    );
  }

  // 留言（先建好根留言，再用真实 parentId 回复）
  const rootComment1 = await run(
    `INSERT INTO comments (pet_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)`,
    [petIds[0], userId, '橘子好可爱！请问它和家里其他猫能相处吗？', null]
  );
  await run(
    `INSERT INTO comments (pet_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)`,
    [petIds[0], orgId, '橘子性格温和，应该可以和脾气温和的猫相处，建议慢慢引入。', rootComment1.lastId]
  );
  const rootComment2 = await run(
    `INSERT INTO comments (pet_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)`,
    [petIds[1], userId, '萨摩耶需要每天遛多久？', null]
  );
  await run(
    `INSERT INTO comments (pet_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)`,
    [petIds[1], orgId, '建议每天 1-2 小时，分早晚两次遛。', rootComment2.lastId]
  );
  await run(
    `INSERT INTO comments (pet_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)`,
    [petIds[6], userId, '黑豆还在吗？想领养。', null]
  );

  // 收藏
  for (const f of [
    { userId, petId: petIds[0] },
    { userId, petId: petIds[1] },
    { userId, petId: petIds[6] },
  ]) {
    await run(
      `INSERT OR IGNORE INTO favorites (user_id, pet_id) VALUES (?, ?)`,
      [f.userId, f.petId]
    );
  }

  // 领养申请
  for (const a of [
    {
      petId: petIds[2], applicantId: userId, reason: '家里没有其他宠物，有时间陪伴小猫长大',
      experience: '之前养过一只田园猫 12 年', contact: '微信 xiaoman_cat', status: 'pending',
    },
    {
      petId: petIds[6], applicantId: userId, reason: '有院子，希望给拉布拉多足够的活动空间',
      experience: '家里养过金毛 8 年', contact: '电话 13800000003', status: 'approved',
    },
  ]) {
    await run(
      `INSERT INTO adoptions (pet_id, applicant_id, reason, experience, contact, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [a.petId, a.applicantId, a.reason, a.experience, a.contact, a.status]
    );
  }

  console.log('[db] Seed completed.');
}
