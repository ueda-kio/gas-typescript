export interface Response {
  ok: boolean;
  query: string;
  messages: Messages;
}

export interface Messages {
  total: number;
  pagination: Pagination;
  paging: Paging;
  matches: Match[];
}

export interface Pagination {
  total_count: number;
  page: number;
  per_page: number;
  page_count: number;
  first: number;
  last: number;
}

export interface Paging {
  count: number;
  total: number;
  page: number;
  pages: number;
}

export interface Match {
  iid: string;
  team: string;
  score: number;
  channel: Channel;
  type: string;
  user: string;
  username: string;
  ts: string;
  attachments: Attachment[];
  blocks: Block2[];
  text: string;
  permalink: string;
}

export interface Channel {
  id: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_shared: boolean;
  is_org_shared: boolean;
  is_ext_shared: boolean;
  is_private: boolean;
  name: string;
  pending_shared: any[];
  is_pending_ext_shared: boolean;
}

export interface Attachment {
  from_url: string;
  ts: string;
  author_id: string;
  channel_id: string;
  channel_team: string;
  is_msg_unfurl: boolean;
  message_blocks: MessageBlock[];
  id: number;
  original_url: string;
  fallback: string;
  text: string;
  author_name: string;
  author_link: string;
  author_icon: string;
  author_subname: string;
  mrkdwn_in: string[];
  footer: string;
}

export interface MessageBlock {
  team: string;
  channel: string;
  ts: string;
  message: Message;
}

export interface Message {
  blocks: Block[];
}

export interface Block {
  type: string;
  block_id: string;
  elements: Element[];
}

export interface Element {
  type: string;
  elements: Element2[];
  style?: string;
  indent?: number;
  border?: number;
}

export interface Element2 {
  type: string;
  text?: string;
  elements?: Element3[];
  name?: string;
}

export interface Element3 {
  type: string;
  text?: string;
  name?: string;
  unicode?: string;
}

export interface Block2 {
  type: string;
  block_id: string;
  elements: Element4[];
}

export interface Element4 {
  type: string;
  elements: Element5[];
}

export interface Element5 {
  type: string;
  user_id?: string;
  text?: string;
  url?: string;
  name?: string;
  unicode?: string;
  style?: Style;
}

export interface Style {
  bold: boolean;
}

