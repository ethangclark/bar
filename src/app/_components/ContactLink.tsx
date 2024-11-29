export function ContactLink() {
  return (
    <a className="text-blue-500" href="mailto:hello@spreader.ai">
      hello@spreader.ai
    </a>
  );
}

export function ContactLine() {
  return (
    <div>
      Have feedback or questions? We'd love to hear from you! Connect at{" "}
      <ContactLink />
    </div>
  );
}

export function ContactFooter() {
  return (
    <div className="mb-8 px-4">
      <ContactLine />
    </div>
  );
}
