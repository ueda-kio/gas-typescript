const SLACK_API_TOKEN = PropertiesService.getScriptProperties().getProperty('SLACK_API_TOKEN');
if (SLACK_API_TOKEN === null) {
  Logger.log('SLACK_API_TOKEN is null.');
}

function doPost(e: GoogleAppsScript.Events.DoPost) {
  const paramText = e.parameter.text;
  if (!paramText) {
    return ContentService.createTextOutput('チェックしたいスレッドのURLを引数で渡してください！:open_hands:');
  }

  const { threadUrl, argStamp } = extractUrlAndStampFromArgument(paramText);
  if (argStamp === false) {
    return ContentService.createTextOutput('第1引数にスレッドのurl、第2引数にスタンプを指定してください！スタンプは指定しなくても構いません！:open_hands:');
  }

  const threadData = getThreadData(threadUrl);
  if (!threadData) {
    return ContentService.createTextOutput('Error: スレッドデータの取得に失敗しました。:pien-2:');
  }

  const reactedUserIds = getReactedUserIds(threadData, argStamp);
  if (!reactedUserIds) return ContentService.createTextOutput('Error: スタンプを押したユーザー一覧の取得に失敗しました。:pien-2:');

  const usersList = getUserListOfReactedOrNot(threadData.channelId, reactedUserIds);
  if (!usersList) return ContentService.createTextOutput('Error: ユーザー一覧の取得に失敗しました。:pien-2:');

  const { reactedUsers, nonReactedUsers } = usersList;
  return ContentService.createTextOutput(
    `【${argStamp || 'スタンプ'}つけた人】\n${returnLogText(reactedUsers)}\n\n【${argStamp || 'スタンプ'}つけてない人】\n${returnLogText(nonReactedUsers)}`
  );
}

function extractUrlAndStampFromArgument(parameter: string) {
  const spaceRegExp = /\s+|　+/;
  if (!spaceRegExp.test(parameter)) return { threadUrl: parameter, argStamp: '' };

  const splitParameter = parameter.split(spaceRegExp);
  const threadUrl = splitParameter[0];
  const argStamp = splitParameter[1];
  const stampRegExp = /^:(.+):$/;
  if (!stampRegExp.test(argStamp)) return { threadUrl, argStamp: false as const };

  return { threadUrl, argStamp };
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

function getReactedUserIds({ channelId, ts }: { channelId: string; ts: string }, argStamp: string) {
  try {
    const replies = UrlFetchApp.fetch('https://slack.com/api/conversations.replies', {
      headers: { Authorization: `Bearer ${SLACK_API_TOKEN}` },
      payload: {
        channel: channelId,
        ts,
      },
    });

    const repliesBody = JSON.parse(replies.getContentText());
    const reactions: {
      name: string;
      users: string[];
      count: string;
    }[] = repliesBody.messages[0].reactions;
    if (typeof reactions === 'undefined') return []; // スタンプを押したユーザーがいない場合.

    // 引数にスタンプを指定したかどうか.
    if (argStamp) {
      const reactionUserIds = reactions.find((reaction) => reaction.name === argStamp.replaceAll(':', ''))?.users ?? [];
      return reactionUserIds;
    } else {
      const _reactionUserIds = reactions.flatMap((reaction) => reaction.users);
      const reactionUserIds = Array.from(new Set(_reactionUserIds)); // 重複削除（いずれか1つ以上のスタンプを押しているか）

      return reactionUserIds;
    }
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
