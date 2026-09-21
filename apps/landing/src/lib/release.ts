
export interface Published {
  version: string;
  publishedAt: string;
}

const REPO = "thiagob7/Ravox-Chat";

export const LINK_MAC = `https://github.com/${REPO}/releases/latest/download/ravox-chat-mac.dmg`;
export const LINK_WINDOWS = `https://github.com/${REPO}/releases/latest/download/ravox-chat-win.exe`;
export const LINK_RELEASES = `https://github.com/${REPO}/releases`;

export async function searchLastVersion(): Promise<Published> {
  const reply = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (!reply.ok) throw new Error(`GitHub respondeu ${reply.status}`);

  const data = (await reply.json()) as { tag_name: string; published_at: string };

  return {
    version: data.tag_name.replace(/^v/, ""),
    publishedAt: data.published_at,
  };
}
