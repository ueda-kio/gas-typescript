const SLACK_API_TOKEN = PropertiesService.getScriptProperties().getProperty('SLACK_API_TOKEN');
if (SLACK_API_TOKEN === null) {
  Logger.log('SLACK_API_TOKEN is null.');
}

function doPost(e: GoogleAppsScript.Events.DoPost) {
  const threadLink = e.parameter.text;
  const threadData = getThreadData(threadLink);
  if (!threadData) {
    Logger.log('Failed to get "threadData".');
    return false;
  }

  const { channelId, ts } = threadData;
  const reactedUserIds = getReactedUserIds(channelId, ts);
  if (!reactedUserIds) return false;

  const usersList = getUserListOfReactedOrNot(channelId, reactedUserIds);
  if (!usersList) return false;

  const { reactedUsers, nonReactedUsers } = usersList;
  return ContentService.createTextOutput(`【スタンプつけた人】\n${returnLogText(reactedUsers)}\n\n【スタンプつけてない人】\n${returnLogText(nonReactedUsers)}`);
}

function getThreadData(threadLink: string) {
  try {
    const messages = UrlFetchApp.fetch('https://slack.com/api/search.messages', {
      headers: { Authorization: `Bearer ${SLACK_API_TOKEN}` },
      payload: {
        query: threadLink,
      },
    });

    const messagesBody = JSON.parse(messages.getContentText());
    const channelId = messagesBody.messages.matches[0].channel.id;
    const ts = messagesBody.messages.matches[0].ts;

    return typeof channelId === 'string' && typeof ts === 'string' ? { channelId, ts } : false;
  } catch (e) {
    Logger.log(e);
    return false;
  }
}

function getReactedUserIds(channelId: string, ts: string) {
  try {
    const replies = UrlFetchApp.fetch('https://slack.com/api/conversations.replies', {
      headers: { Authorization: `Bearer ${SLACK_API_TOKEN}` },
      payload: {
        channel: channelId,
        ts,
      },
    });

    const repliesBody = JSON.parse(replies.getContentText());
    const _reactionUserIds = (repliesBody.messages[0].reactions as { users: string[] }[]).flatMap((reaction) => reaction.users);
    const reactionUserIds = Array.from(new Set(_reactionUserIds)); // Remove duplicates.

    return reactionUserIds;
  } catch (e) {
    Logger.log(e);
    return false;
  }
}

function getUserListOfReactedOrNot(channelId: string, reactedUserIds: string[]) {
  // - UEG0H6XTL: Polly
  const excludeIds = ['UEG0H6XTL'];

  try {
    const allChannelMembers = UrlFetchApp.fetch('https://slack.com/api/conversations.members', {
      headers: { Authorization: `Bearer ${SLACK_API_TOKEN}` },
      payload: {
        channel: channelId,
      },
    });

    const channelMemberIds = JSON.parse(allChannelMembers.getContentText()).members as string[];
    const reactedUsers: string[] = [];
    const nonReactedUsers: string[] = [];
    for (const id of channelMemberIds) {
      if (excludeIds.includes(id)) continue;
      reactedUserIds.includes(id) ? reactedUsers.push(`<@${id}>`) : nonReactedUsers.push(`<@${id}>`);
    }

    return { reactedUsers, nonReactedUsers };
  } catch (e) {
    Logger.log(e);
    return false;
  }
}

function returnLogText(usersList: string[]) {
  return usersList.length === 0 ? 'いません！' : usersList.join('\n');
}
