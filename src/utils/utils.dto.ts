import { ReadStream } from 'fs';
export class EmailAttachmentDTO {
    filename: string;
    content: ReadStream;
  }
  