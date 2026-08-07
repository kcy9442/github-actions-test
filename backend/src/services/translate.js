const { TranslateClient, TranslateTextCommand } = require('@aws-sdk/client-translate');
const config = require('../config');

const PRODUCT_LANGUAGES = ['en', 'ja', 'zh'];
const PRODUCT_FIELDS = ['name', 'reason', 'store', 'discountInfo'];

function createTranslateService(client) {
  // 리뷰처럼 원문 언어를 모를 때는 auto, 한국어 상품처럼 알 때는 ko를 명시한다.
  async function translateText(text, targetLang, sourceLang = 'auto') {
    const result = await client.send(
      new TranslateTextCommand({
        Text: text,
        SourceLanguageCode: sourceLang,
        TargetLanguageCode: targetLang,
      })
    );
    return { translatedText: result.TranslatedText, sourceLang: result.SourceLanguageCode };
  }

  async function translateProduct(fields) {
    const languageEntries = await Promise.all(
      PRODUCT_LANGUAGES.map(async (language) => {
        const fieldEntries = await Promise.all(
          PRODUCT_FIELDS.map(async (field) => {
            const value = fields[field];
            if (!value || !String(value).trim()) return null;
            const { translatedText } = await translateText(String(value), language, 'ko');
            return [field, translatedText];
          })
        );
        return [language, Object.fromEntries(fieldEntries.filter(Boolean))];
      })
    );
    return Object.fromEntries(languageEntries);
  }

  return { translateText, translateProduct };
}

const service = createTranslateService(new TranslateClient({ region: config.awsRegion }));

module.exports = { ...service, createTranslateService };
