﻿const github = JSON.parse(process.env.GITHUB);

/**
 * @param payload
 */
function transformPayload(payload) {
  const title = `GitHub Alert: ${payload.alert?.tool?.name || ''}`;
  const repository = payload.repository?.full_name || '';
  const sender = payload.sender?.login || '';
  const url = payload.alert?.html_url || '';

  const teamsPayload = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: '0076D7',
    title: title,
    text: `**Repository:** ${repository}\n\n**Triggered by:** ${sender}\n\n**Alert URL:** ${url}`,
  };
  return teamsPayload;
}

(async () => {
  if (!process.env.TEAMS_WEBHOOK_URL) {
    // TODO: add better log message
    console.log('Skipped 1');
    return;
  }

  const event = github.event.watch;

  let userInfoRes;
  try {
    userInfoRes = await fetch(
      `https://api.github.com/repos/${github.event.repository.owner.login}/${github.event.repository.name}/collaborators/${event.user.login}/permission`,
      {
        headers: {
          Authorization: `Bearer ${github.token}`,
        },
      }
    );

    userInfoRes = await userInfoRes.json();
  } catch (error) {
    console.log('Error occurred while fetching user permission', error);
    process.exit(1);
  }

  // don't create Jira issue if PR is created by admin
  if (github.event.watch && userInfoRes.permission === 'admin') {
    // TODO: add better log message
    console.log('Skipped 2');
    return;
  }

  try {
    await fetch(process.env.TEAMS_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({
        ...transformPayload(event.body),
      }),
    });
  } catch (error) {
    // TODO: add better log message
    console.log('Error occurred ', error);
    process.exit(1);
  }
})();