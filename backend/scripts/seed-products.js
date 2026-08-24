// 1회성 수동 스크립트. terraform apply로 product_catalog 테이블을 만든 뒤
// `AWS_REGION=ap-northeast-2 node backend/scripts/seed-products.js`로 직접 실행
// (AWS 자격증명 필요, bedrock:InvokeModel 권한 포함 - 번역/임베딩 둘 다 Bedrock을 씀).
const fs = require('fs');
const path = require('path');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const translate = require('../src/services/bedrockTranslate');
const embeddings = require('../src/services/embeddings');

const TABLE_NAME = process.env.PRODUCT_CATALOG_TABLE_NAME;
const ITEMS_JSON_PATH = path.join(__dirname, '..', '..', 'json', 'items.json');
const BATCH_SIZE = Number.parseInt(process.env.SEED_BATCH_SIZE || '10', 10);
const SKIP_AI_ENRICHMENT = process.env.SKIP_AI_ENRICHMENT === 'true';
// Bedrock InvokeModel은 계정 기본 TPS가 낮아서(AWS Translate 대비 훨씬 낮음), 상품 65개를
// CONCURRENCY=10으로 예전처럼 필드×언어별 12번씩 동시 호출했다가 ThrottlingException이 남 -
// admin.js와 동일하게 상품 1개당 번역 1번(translateProduct, 배치)+임베딩 1번으로 줄이고,
// 그래도 동시에 너무 많이 나가지 않게 동시 처리 개수도 낮춤
const CONCURRENCY = 3;

if (!TABLE_NAME) {
  console.error('PRODUCT_CATALOG_TABLE_NAME env var is required');
  process.exit(1);
}

if (!Number.isInteger(BATCH_SIZE) || BATCH_SIZE < 1) {
  console.error('SEED_BATCH_SIZE must be a positive integer');
  process.exit(1);
}

// 상품 리스트를 동시에 CONCURRENCY개씩만 처리 (Translate 쓰로틀링 방지)
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

// items.json은 유효한 단일 JSON이 아니라 배열 [...] 3개가 그냥 이어붙여진 텍스트라서
// ']' 다음에 '[' 가 나오는 지점을 기준으로 쪼개 각각 파싱한다.
function parseConcatenatedArrays(text) {
  const chunks = text.trim().split(/\]\s*\[/);
  return chunks.flatMap((chunk, index) => {
    const withOpen = index === 0 ? chunk : `[${chunk}`;
    const withClose = index === chunks.length - 1 ? withOpen : `${withOpen}]`;
    return JSON.parse(withClose);
  });
}

async function main() {
  const raw = fs.readFileSync(ITEMS_JSON_PATH, 'utf8');
  const items = parseConcatenatedArrays(raw);

  const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

  // Bedrock에는 모델/리전별 일일 토큰 한도가 있으므로, 이미 다국어 번역까지 기록된
  // 상품은 다시 호출하지 않는다. workflow를 여러 번 실행하면 다음 미처리 상품 묶음으로
  // 자연스럽게 이어진다.
  const pendingItems = [];
  const existingItems = new Map();
  for (const item of items) {
    const existing = await client.send(new GetCommand({ TableName: TABLE_NAME, Key: { itemId: item.itemId } }));
    existingItems.set(item.itemId, existing.Item);
    if (SKIP_AI_ENRICHMENT) {
      pendingItems.push(item);
      continue;
    }
    if (existing.Item?.translations && Object.keys(existing.Item.translations).length > 0) {
      console.log(`skipping already translated ${item.itemId}`);
      continue;
    }
    pendingItems.push(item);
  }
  // AI를 쓰지 않는 긴급 시드에서는 토큰 한도와 무관하므로 전체 카탈로그를 한 번에 넣는다.
  const batch = SKIP_AI_ENRICHMENT ? pendingItems : pendingItems.slice(0, BATCH_SIZE);

  console.log(
    SKIP_AI_ENRICHMENT
      ? `seeding ${batch.length} products without Bedrock translations or embeddings...`
      : `translating ${batch.length} of ${pendingItems.length} pending products (en, ja, zh)...`
  );
  await mapWithConcurrency(batch, CONCURRENCY, async (item) => {
    const existing = existingItems.get(item.itemId);
    // 상품 1개당 필드×언어 12번 대신 배치 요청 1번(admin.js가 쓰는 것과 동일 함수)
    const translations = SKIP_AI_ENRICHMENT ? existing?.translations || {} : await translate.translateProduct(item);
    // "AI로 찾기"가 관련 상품을 찾으려면 임베딩이 필요함 - 시딩 자체가 실패하면 안 되니
    // 실패해도(예: 모델 액세스 미활성화) embedding 없이 계속 진행함
    const embedding = SKIP_AI_ENRICHMENT
      ? existing?.embedding || null
      : await embeddings.embedText(embeddings.buildProductEmbeddingText(item)).catch((err) => {
          console.error(`embedding failed for ${item.itemId}`, err);
          return null;
        });

    const record = {
      itemId: item.itemId,
      category: item.category,
      name: item.name,
      price: item.price,
      store: item.store,
      reason: item.reason,
      imageUrl: item.imageUrl,
      translations,
    };
    if (item.discountInfo) record.discountInfo = item.discountInfo;
    if (embedding) record.embedding = embedding;

    await client.send(new PutCommand({ TableName: TABLE_NAME, Item: record }));
    console.log(`seeded ${record.itemId}`);
  });

  console.log(`done - ${batch.length} products written to ${TABLE_NAME}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
