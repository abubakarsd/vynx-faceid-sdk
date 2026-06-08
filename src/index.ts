export * from './FaceIDCamera';

export interface FaceIDConfig {
  apiKey: string;
  endpoint: string;
}

export interface EnrollOptions {
  externalUserId: string;
  imageUris: string[];
}

export interface VerifyOptions {
  externalUserId: string;
  imageUri: string;
  targetEmbedding: number[];
  requireLiveness?: boolean;
}

export interface RecognizeOptions {
  imageUri: string;
  candidates: Array<{ id: string; embedding: number[] }>;
  requireLiveness?: boolean;
}

export interface LivenessOptions {
  imageUri: string;
  expectedAction?: string;
  landmarksSeq?: Array<Record<string, { x: number; y: number }>>;
}

export class FaceID {
  public static readonly VERSION: string = '1.0.0';
  private static apiKey: string = '';
  private static endpoint: string = '';

  /**
   * Retrieves SDK version and product metadata.
   */
  static getVersionInfo() {
    return {
      version: this.VERSION,
      framework: 'React Native',
      description: 'Official React Native SDK for Vynx FaceID biometric identity systems.',
      homepage: 'https://vynxfaceid.com',
    };
  }

  static initialize(config: FaceIDConfig): void {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint.endsWith('/') ? config.endpoint.slice(0, -1) : config.endpoint;
    console.log('Vynx FaceID SDK Initialized.');
  }

  /**
   * Enrolls a new user with face images.
   */
  static async enroll(options: EnrollOptions): Promise<{ success: boolean; externalUserId: string; embeddings: number[][] }> {
    if (!this.apiKey || !this.endpoint) {
      throw new Error('Vynx FaceID SDK not initialized. Call FaceID.initialize() first.');
    }

    const formData = new FormData();
    formData.append('externalUserId', options.externalUserId);

    for (let i = 0; i < options.imageUris.length; i++) {
      const uri = options.imageUris[i];
      const filename = uri.split('/').pop() || `face_${i}.jpg`;
      formData.append('images', {
        uri: uri,
        type: 'image/jpeg',
        name: filename,
      } as any);
    }

    try {
      const response = await fetch(`${this.endpoint}/face/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Enrollment API error (${response.status}): ${errText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('FaceID.enroll failed:', error.message);
      throw error;
    }
  }

  /**
   * Performs 1:1 verification with optional liveness.
   */
  static async verify(options: VerifyOptions): Promise<{ verified: boolean; confidence: number; liveness_passed: boolean; liveness_score: number }> {
    if (!this.apiKey || !this.endpoint) {
      throw new Error('Vynx FaceID SDK not initialized. Call FaceID.initialize() first.');
    }

    const formData = new FormData();
    formData.append('externalUserId', options.externalUserId);
    formData.append('targetEmbedding', JSON.stringify(options.targetEmbedding));
    formData.append('requireLiveness', options.requireLiveness !== false ? 'true' : 'false');
    
    const filename = options.imageUri.split('/').pop() || 'verify.jpg';
    formData.append('image', {
      uri: options.imageUri,
      type: 'image/jpeg',
      name: filename,
    } as any);

    try {
      const response = await fetch(`${this.endpoint}/face/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Verification API error (${response.status}): ${errText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('FaceID.verify failed:', error.message);
      throw error;
    }
  }

  /**
   * Performs 1:N recognition against candidate identities with optional liveness.
   */
  static async recognize(options: RecognizeOptions): Promise<{ success: boolean; liveness_passed: boolean; liveness_score: number; matches: Array<{ id: string; confidence: number }> }> {
    if (!this.apiKey || !this.endpoint) {
      throw new Error('Vynx FaceID SDK not initialized. Call FaceID.initialize() first.');
    }

    const formData = new FormData();
    formData.append('candidates', JSON.stringify(options.candidates));
    formData.append('requireLiveness', options.requireLiveness !== false ? 'true' : 'false');
    
    const filename = options.imageUri.split('/').pop() || 'recognize.jpg';
    formData.append('image', {
      uri: options.imageUri,
      type: 'image/jpeg',
      name: filename,
    } as any);

    try {
      const response = await fetch(`${this.endpoint}/face/recognize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Recognition API error (${response.status}): ${errText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('FaceID.recognize failed:', error.message);
      throw error;
    }
  }

  /**
   * Runs isolated passive/active liveness checking.
   */
  static async checkLiveness(options: LivenessOptions): Promise<{ passed: boolean; score: number; active_liveness_verified: boolean | null }> {
    if (!this.apiKey || !this.endpoint) {
      throw new Error('Vynx FaceID SDK not initialized. Call FaceID.initialize() first.');
    }

    const formData = new FormData();
    if (options.expectedAction) {
      formData.append('expectedAction', options.expectedAction);
    }
    if (options.landmarksSeq) {
      formData.append('landmarksSeq', JSON.stringify(options.landmarksSeq));
    }

    const filename = options.imageUri.split('/').pop() || 'liveness.jpg';
    formData.append('image', {
      uri: options.imageUri,
      type: 'image/jpeg',
      name: filename,
    } as any);

    try {
      const response = await fetch(`${this.endpoint}/face/liveness-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Liveness API error (${response.status}): ${errText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('FaceID.checkLiveness failed:', error.message);
      throw error;
    }
  }
}
