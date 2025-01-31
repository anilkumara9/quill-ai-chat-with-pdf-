interface EmbeddingResponse {
  embeddings: number[];
  metadata?: {
    dimensions: number;
    model: string;
  };
}

export async function generateEmbeddings(
  content: { chunks: string[]; metadata: any }
): Promise<number[][]> {
  try {
    // Initialize embeddings array
    const embeddings: number[][] = [];

    // Process each chunk
    for (const chunk of content.chunks) {
      // Generate embedding using AWAN API
      const response = await fetch('https://api.awan.ai/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 374df25c-93cd-411b-b34f-8dc40b26bbd6',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: chunk,
          model: 'awan-embedding-v1',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate embeddings: ${response.statusText}`);
      }

      const result: EmbeddingResponse = await response.json();
      embeddings.push(result.embeddings);
    }

    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function findMostSimilarChunks(
  query: number[],
  documentEmbeddings: number[][],
  topK: number = 3
): { index: number; similarity: number }[] {
  const similarities = documentEmbeddings.map((embedding, index) => ({
    index,
    similarity: cosineSimilarity(query, embedding),
  }));

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

export async function semanticSearch(
  query: string,
  documentEmbeddings: number[][]
): Promise<{ chunks: number[]; scores: number[] }> {
  try {
    // Generate embedding for the query
    const response = await fetch('https://api.awan.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 374df25c-93cd-411b-b34f-8dc40b26bbd6',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: query,
        model: 'awan-embedding-v1',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate query embedding: ${response.statusText}`);
    }

    const result: EmbeddingResponse = await response.json();
    const queryEmbedding = result.embeddings;

    // Find most similar chunks
    const similarChunks = findMostSimilarChunks(queryEmbedding, documentEmbeddings);

    return {
      chunks: similarChunks.map(chunk => chunk.index),
      scores: similarChunks.map(chunk => chunk.similarity),
    };
  } catch (error) {
    console.error('Semantic search error:', error);
    throw error;
  }
} 