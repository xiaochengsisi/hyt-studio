/** 存储抽象：屏蔽本地与对象存储差异，便于切换 */
export interface StoredFile {
  /** 可访问的最终 URL */
  url: string;
  /** 存储内的文件名 / key */
  filename: string;
}

export interface StoragePort {
  /** 保存文件，返回可访问 URL 与文件名 */
  save(file: { buffer: Buffer; originalname: string }): Promise<StoredFile>;
}

export const STORAGE_PORT = Symbol('STORAGE_PORT');
