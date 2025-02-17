import escapeHtml from "escape-html";

// Email HTML body
export function html({
  urlWithLoginToken,
  email,
}: {
  urlWithLoginToken: string;
  email: string;
}) {
  const escapedEmail = `${email.replace(/\./g, "&#8203;.")}`;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const escapedUrl = escapeHtml(urlWithLoginToken);
  return `
    <body>
      <p>Sign into SummitEd as <strong>${escapedEmail}</strong> by clicking <a href="${urlWithLoginToken}">here</a>, or by vising the following link:<br><br><a href="${urlWithLoginToken}">${escapedUrl}</a></p>
    </body>
  `;
}

// Email text body
export function text({
  urlWithLoginToken,
  email,
}: {
  urlWithLoginToken: string;
  email: string;
}) {
  return `Sign in to SummitEd as ${email} with this link: ${urlWithLoginToken}\n\n`;
}
