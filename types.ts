
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Source {
  uri: string;
  title: string;
}

export interface ChatMessage {
  role: Role;
  content: string;
  sources?: Source[];
}
