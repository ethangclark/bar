import escapeHtml from "escape-html";

export function loginEmailHtml({
  urlWithSetPasswordToken,
  email,
}: {
  urlWithSetPasswordToken: string;
  email: string;
}) {
  const escapedEmail = `${email.replace(/\./g, "&#8203;.")}`;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const escapedUrl = escapeHtml(urlWithSetPasswordToken);
  return `
    <body>
      <p>Set your SummitEd password for <strong>${escapedEmail}</strong> by <a href="${urlWithSetPasswordToken}">clicking here</a>, or by visiting the following link:<br><br><a href="${urlWithSetPasswordToken}">${escapedUrl}</a></p>
    </body>
  `;
}

export function loginEmailText({
  urlWithSetPasswordToken,
  email,
}: {
  urlWithSetPasswordToken: string;
  email: string;
}) {
  return `Set your SummitEd password for ${email} with this link: ${urlWithSetPasswordToken}\n\n`;
}
