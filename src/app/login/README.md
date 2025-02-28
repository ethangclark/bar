We use single-use magic login links that immediately log the user in.

Some email scanners visit links in advance, which is a pain. To get around this, we first direct users to `/login`, which we specifically configure in middleware.ts NOT to have cookies set on it automatically. This route then redirects to `/login/link`, where the actual login logic lives. This redirect allows us to access cookies for users who already have one set; we would not be able to access them in `/login` because we use the `sameSite: strict` policy on cookies. `/login/link` then lets the user login IFF they've got a session setup and are using the magic link.

TODO: if they have the token but not the session, maybe we should redirect them to a page that requires manual confirmation so users can link-share.
