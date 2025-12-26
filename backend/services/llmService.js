import OpenAI from 'openai';
import { getConfig } from './configManager.js';

let openaiClient = null;

/**
 * 初始化OpenAI客户端
 */
async function initClient() {
  const config = await getConfig();
  
  if (!config.configured || !config.apiKey) {
    throw new Error('API配置未完成，请先配置API Key');
  }
  
  openaiClient = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.apiBaseUrl
  });
  
  return config.model;
}

/**
 * 翻译单个文本
 */
async function translateText(text, model) {
  try {
    if (!openaiClient) {
      await initClient();
    }
    
    const config = await getConfig();
    const actualModel = model || config.model;
    
    const prompt = `请将以下Minecraft模组的英文文本翻译成简体中文。保持原有的格式和特殊字符（如颜色代码、占位符等）。只返回翻译结果，不要添加任何解释。

原文：
${text}

翻译：`;
    
    const response = await openaiClient.chat.completions.create({
      model: actualModel,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的Minecraft模组翻译助手，擅长将英文游戏文本翻译成自然流畅的简体中文。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });
    
    const translation = response.choices[0]?.message?.content?.trim() || text;
    return translation;
  } catch (error) {
    console.error('翻译失败:', error);
    throw new Error(`翻译失败: ${error.message}`);
  }
}

/**
 * 批量翻译
 */
export async function translateBatch(texts, onProgress = null) {
  try {
    const config = await getConfig();
    const model = config.model;
    
    const results = [];
    const total = texts.length;
    
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      
      try {
        const translation = await translateText(text, model);
        results.push({
          original: text,
          translation: translation,
          success: true
        });
        
        // 报告进度
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: total,
            percentage: Math.round(((i + 1) / total) * 100)
          });
        }
        
        // 避免API速率限制，添加小延迟
        if (i < texts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        results.push({
          original: text,
          translation: text, // 失败时使用原文
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('批量翻译失败:', error);
    throw error;
  }
}

/**
 * 估算文本的token数量（简单估算：1 token ≈ 4个字符）
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * 翻译JSON对象 - 一次性翻译所有内容（如果内容过多则分批处理）
 */
export async function translateJsonData(jsonData, onProgress = null) {
  try {
    if (!openaiClient) {
      await initClient();
    }
    
    const config = await getConfig();
    const model = config.model;
    
    // 提取所有需要翻译的键值对
    const entriesToTranslate = [];
    for (const [key, value] of Object.entries(jsonData)) {
      if (typeof value === 'string' && value.trim().length > 0) {
        entriesToTranslate.push({ key, value });
      }
    }
    
    if (entriesToTranslate.length === 0) {
      return {
        translatedJson: jsonData,
        resultArray: []
      };
    }
    
    // 报告开始翻译
    if (onProgress) {
      onProgress({
        current: 0,
        total: entriesToTranslate.length,
        percentage: 0
      });
    }
    
    // 构建翻译提示词模板
    const systemPrompt = '你是一个专业的Minecraft模组翻译助手，擅长将英文游戏文本翻译成自然流畅的简体中文。请严格按照要求返回JSON格式的翻译结果。';
    const promptTemplate = `请将以下Minecraft模组的英文文本翻译成简体中文。保持原有的格式和特殊字符（如颜色代码、占位符等）。

要求：
1. 返回一个JSON对象，键名保持不变，只翻译值
2. 保持所有特殊字符和格式代码（如 §、%s、%d 等）
3. 翻译要自然流畅，符合中文表达习惯
4. 只返回JSON对象，不要添加任何解释

需要翻译的内容：
{CONTENT}

请返回JSON格式的翻译结果：`;
    
    // 估算每个条目的token数，决定是否分批
    const MAX_TOKENS_PER_REQUEST = 3000; // 保守估计，留出余量
    const entriesList = entriesToTranslate.map((entry, index) => 
      `${index + 1}. Key: "${entry.key}"\n   Value: "${entry.value}"`
    ).join('\n\n');
    
    const estimatedTokens = estimateTokens(entriesList) + estimateTokens(promptTemplate);
    
    let allTranslatedJson = {};
    
    if (estimatedTokens > MAX_TOKENS_PER_REQUEST) {
      // 需要分批处理
      const batchSize = Math.max(1, Math.floor(entriesToTranslate.length / Math.ceil(estimatedTokens / MAX_TOKENS_PER_REQUEST)));
      
      for (let i = 0; i < entriesToTranslate.length; i += batchSize) {
        const batch = entriesToTranslate.slice(i, i + batchSize);
        const batchList = batch.map((entry, index) => 
          `${index + 1}. Key: "${entry.key}"\n   Value: "${entry.value}"`
        ).join('\n\n');
        
        const prompt = promptTemplate.replace('{CONTENT}', batchList);
        
        // 报告进度
        if (onProgress) {
          onProgress({
            current: i,
            total: entriesToTranslate.length,
            percentage: Math.round((i / entriesToTranslate.length) * 90) // 留10%给最后处理
          });
        }
        
        // 调用AI进行翻译
        const response = await openaiClient.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 8000
        });
        
        const responseText = response.choices[0]?.message?.content?.trim() || '{}';
        const batchTranslated = parseTranslationResponse(responseText, batch);
        allTranslatedJson = { ...allTranslatedJson, ...batchTranslated };
      }
    } else {
      // 一次性翻译所有内容
      const prompt = promptTemplate.replace('{CONTENT}', entriesList);
      
      // 报告翻译中
      if (onProgress) {
        onProgress({
          current: entriesToTranslate.length / 2,
          total: entriesToTranslate.length,
          percentage: 50
        });
      }
      
      // 调用AI进行翻译
      const response = await openaiClient.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 8000
      });
      
      const responseText = response.choices[0]?.message?.content?.trim() || '{}';
      allTranslatedJson = parseTranslationResponse(responseText, entriesToTranslate);
    }
    
    // 创建翻译后的JSON对象（合并翻译结果和原文）
    const finalTranslatedData = { ...jsonData };
    for (const entry of entriesToTranslate) {
      if (allTranslatedJson[entry.key]) {
        finalTranslatedData[entry.key] = allTranslatedJson[entry.key];
      }
    }
    
    // 构建结果数组（用于前端显示）
    const resultArray = [];
    for (const entry of entriesToTranslate) {
      resultArray.push({
        key: entry.key,
        original: entry.value,
        translation: allTranslatedJson[entry.key] || entry.value
      });
    }
    
    // 报告完成
    if (onProgress) {
      onProgress({
        current: entriesToTranslate.length,
        total: entriesToTranslate.length,
        percentage: 100
      });
    }
    
    return {
      translatedJson: finalTranslatedData,
      resultArray: resultArray
    };
  } catch (error) {
    console.error('翻译JSON数据失败:', error);
    throw error;
  }
}

/**
 * 解析AI返回的翻译结果
 */
function parseTranslationResponse(responseText, entriesToTranslate) {
  let translatedJson = {};
  
  try {
    // 尝试提取JSON（可能包含markdown代码块）
    let jsonText = responseText;
    
    // 如果包含markdown代码块，提取其中的JSON
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // 尝试直接提取第一个JSON对象
      const braceMatch = responseText.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonText = braceMatch[0];
      }
    }
    
    translatedJson = JSON.parse(jsonText);
  } catch (parseError) {
    console.error('解析翻译结果失败:', parseError);
    console.error('原始响应:', responseText);
    // 如果解析失败，使用原文
    for (const entry of entriesToTranslate) {
      translatedJson[entry.key] = entry.value;
    }
  }
  
  return translatedJson;
}

